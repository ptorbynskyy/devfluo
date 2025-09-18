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
 * Convert basic search result to full MemoryCardSearchResult
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
 * Search for memory cards using vector similarity
 */
export async function searchMemoryCards(
	scope: string,
	query: string,
	limit = 10,
): Promise<MemoryCardSearchResult[]> {
	try {
		// If embedding service is not ready, fall back to text search
		if (!isEmbeddingServiceReady()) {
			return await fallbackTextSearch(scope, query, limit);
		}

		// Ensure index consistency before searching
		await ensureIndexConsistency(scope);

		const index = await getIndex(scope);

		// Use the core search functionality
		const basicResults = await searchIndex(index, query, limit);

		// Enrich results with full memory card data
		const enrichedResults: MemoryCardSearchResult[] = [];
		for (const basicResult of basicResults) {
			const enriched = await enrichSearchResult(basicResult);
			if (enriched) {
				enrichedResults.push(enriched);
			}
		}

		return enrichedResults;
	} catch (error) {
		console.error("Vector search failed, falling back to text search:", error);
		return await fallbackTextSearch(scope, query, limit);
	}
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
