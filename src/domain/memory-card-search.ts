// ABOUTME: Memory card search public API with fallback text search

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isEmbeddingServiceReady } from "./embedding-service.js";
import { getInitiativeMemoryCardsPath } from "./initiative/paths.js";
import { getIndex, searchIndex } from "./memory-card-index-core.js";
import {
	ensureIndexConsistency,
	indexMemoryCard as indexMemoryCardImpl,
	removeMemoryCardFromIndex,
} from "./memory-card-index-manager.js";
import type { MemoryCard } from "./memory-card-schema.js";
import type { MemoryCardSearchResult } from "./memory-card-search-schema.js";
import {
	globalMemoryCardsPath,
	loadGlobalMemoryCard,
	loadInitiativeMemoryCard,
} from "./memory-cards.js";

/**
 * Enriched chunk result containing parent card and chunk information
 */
export interface EnrichedChunkResult {
	parentCard: MemoryCard;
	chunkContent: string;
	chunkIndex: number;
	totalChunks: number;
	relevanceScore: number;
}

/**
 * Get memory cards directory for a given scope
 */
function getMemoryCardsDir(scope: string): string {
	if (scope === "global") {
		return globalMemoryCardsPath;
	}
	return getInitiativeMemoryCardsPath(scope);
}

/**
 * Index a memory card in the vector database
 */
export async function indexMemoryCard(
	memoryCard: MemoryCard,
	scope: string,
): Promise<void> {
	// Delegate to the new implementation
	return indexMemoryCardImpl(memoryCard, scope);
}

/**
 * Remove a memory card from the index
 */
export async function removeFromIndex(
	scope: string,
	name: string,
): Promise<boolean> {
	// Delegate to the new implementation
	return removeMemoryCardFromIndex(scope, name);
}

/**
 * Convert chunk search result to enriched chunk result
 */
async function enrichChunkResult(chunkResult: {
	cardName: string;
	scope: string;
	score: number;
	chunkIndex: number;
	totalChunks: number;
	chunkContent: string;
}): Promise<EnrichedChunkResult | null> {
	const { cardName, scope, score, chunkIndex, totalChunks, chunkContent } =
		chunkResult;

	// Load the full memory card data
	const memoryCard =
		scope === "global"
			? await loadGlobalMemoryCard(cardName)
			: await loadInitiativeMemoryCard(scope, cardName);

	if (!memoryCard) {
		return null;
	}

	return {
		parentCard: memoryCard,
		chunkContent,
		chunkIndex,
		totalChunks,
		relevanceScore: score,
	};
}

/**
 * Convert basic search result to full MemoryCardSearchResult (fallback compatibility)
 */
async function enrichSearchResult(basicResult: {
	name: string;
	scope: string;
	score: number;
}): Promise<MemoryCardSearchResult | null> {
	const { name, scope, score } = basicResult;

	// Load the full memory card data
	const memoryCard =
		scope === "global"
			? await loadGlobalMemoryCard(name)
			: await loadInitiativeMemoryCard(scope, name);

	if (!memoryCard) {
		return null;
	}

	return {
		...memoryCard,
		relevanceScore: score,
	};
}

/**
 * Search result with chunk excerpts for enhanced formatting
 */
export interface SearchResultWithExcerpts {
	parentCard: MemoryCard;
	relevanceScore: number;
	excerpts: Array<{
		content: string;
		chunkIndex: number;
		score: number;
	}>;
}

/**
 * Search for memory cards and return results with chunk excerpts
 */
export async function searchMemoryCardsWithExcerpts(
	scope: string,
	query: string,
	limit = 10,
): Promise<SearchResultWithExcerpts[]> {
	try {
		// If embedding service is not ready, fall back to text search
		if (!isEmbeddingServiceReady()) {
			const fallbackResults = await fallbackTextSearch(scope, query, limit);
			return fallbackResults.map((result) => ({
				parentCard: result,
				relevanceScore: result.relevanceScore,
				excerpts: [
					{
						content: result.content,
						chunkIndex: 0,
						score: result.relevanceScore,
					},
				],
			}));
		}

		// Ensure index consistency before searching
		await ensureIndexConsistency(scope);

		const index = await getIndex(scope);

		// Search with higher limit to get more chunks, then group
		const chunkResults = await searchIndex(index, query, limit * 5);

		// Enrich chunk results
		const enrichedChunks: EnrichedChunkResult[] = [];
		for (const chunkResult of chunkResults) {
			const enriched = await enrichChunkResult(chunkResult);
			if (enriched) {
				enrichedChunks.push(enriched);
			}
		}

		// Group chunks by parent card
		return groupChunksWithExcerpts(enrichedChunks, limit, scope);
	} catch (error) {
		console.error("Vector search failed, falling back to text search:", error);
		const fallbackResults = await fallbackTextSearch(scope, query, limit);
		return fallbackResults.map((result) => ({
			parentCard: result,
			relevanceScore: result.relevanceScore,
			excerpts: [
				{
					content: result.content,
					chunkIndex: 0,
					score: result.relevanceScore,
				},
			],
		}));
	}
}

/**
 * Group chunks with excerpts for enhanced search results
 */
function groupChunksWithExcerpts(
	enrichedChunks: EnrichedChunkResult[],
	limit: number,
	scope: string,
): SearchResultWithExcerpts[] {
	// Group chunks by card name
	const cardGroups = new Map<string, EnrichedChunkResult[]>();

	for (const chunk of enrichedChunks) {
		const cardKey = `${chunk.parentCard.name}::${scope}`;
		if (!cardGroups.has(cardKey)) {
			cardGroups.set(cardKey, []);
		}
		cardGroups.get(cardKey)?.push(chunk);
	}

	// Create results with excerpts
	const results: SearchResultWithExcerpts[] = [];

	for (const [, chunks] of cardGroups) {
		if (results.length >= limit || chunks.length === 0) break;

		// Sort chunks by relevance score
		chunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

		// Take the first chunk as representative (highest score)
		const representativeChunk = chunks[0];
		if (!representativeChunk) continue;

		// Calculate average relevance score
		const avgScore =
			chunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0) /
			chunks.length;

		// Create excerpts from top scoring chunks
		const excerpts = chunks.slice(0, 3).map((chunk) => ({
			content: chunk.chunkContent,
			chunkIndex: chunk.chunkIndex,
			score: chunk.relevanceScore,
		}));

		results.push({
			parentCard: representativeChunk.parentCard,
			relevanceScore: avgScore,
			excerpts,
		});
	}

	// Sort final results by relevance score
	return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Fallback text search when vector search is not available
 */
export async function fallbackTextSearch(
	scope: string,
	query: string,
	limit = 10,
): Promise<MemoryCardSearchResult[]> {
	try {
		const memoryCardsDir = getMemoryCardsDir(scope);

		// Get all memory card files
		let files: string[];
		try {
			files = await readdir(memoryCardsDir);
		} catch {
			// Directory doesn't exist
			return [];
		}

		const mdFiles = files.filter((file) => file.endsWith(".md"));
		const results: Array<{ name: string; score: number; content: string }> = [];

		const queryLower = query.toLowerCase();

		// Simple text matching
		for (const file of mdFiles) {
			const name = path.basename(file, ".md");
			try {
				const content = await readFile(
					path.join(memoryCardsDir, file),
					"utf-8",
				);
				const contentLower = content.toLowerCase();

				// Calculate simple relevance score
				let score = 0;

				// Exact phrase match gets highest score
				if (contentLower.includes(queryLower)) {
					score += 10;
				}

				// Word matches
				const queryWords = queryLower.split(/\s+/);
				for (const word of queryWords) {
					if (word.length > 2) {
						// Count occurrences
						const matches = (contentLower.match(new RegExp(word, "g")) || [])
							.length;
						score += matches;
					}
				}

				if (score > 0) {
					results.push({ name, score, content });
				}
			} catch (error) {
				console.error(`Error reading memory card ${file}:`, error);
			}
		}

		// Sort by score and limit results
		const sortedResults = results
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);

		// Convert to MemoryCardSearchResult format
		const enrichedResults: MemoryCardSearchResult[] = [];
		for (const result of sortedResults) {
			const enriched = await enrichSearchResult({
				name: result.name,
				scope,
				score: result.score / 10, // Normalize to 0-1 range
			});
			if (enriched) {
				enrichedResults.push(enriched);
			}
		}

		return enrichedResults;
	} catch (error) {
		console.error("Text search failed:", error);
		return [];
	}
}
