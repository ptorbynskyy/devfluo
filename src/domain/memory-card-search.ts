// ABOUTME: Vectra-based memory card search with local vector database (replaces ChromaDB)

import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { LocalIndex } from "vectra";
import { config } from "../config.js";
import {
	generateEmbedding,
	initializeEmbeddingService,
	isEmbeddingServiceReady,
} from "./embedding-service.js";
import type { MemoryCard } from "./memory-card-schema.js";
import type { MemoryCardSearchResult } from "./memory-card-search-schema.js";

// Module-level state
const indexes: Map<string, LocalIndex> = new Map();

/**
 * Get the index path for a specific scope
 */
function getIndexPath(scope: string): string {
	if (scope === "global") {
		return path.join(config.VECTOR_INDEX_PATH, "global");
	}
	return path.join(config.VECTOR_INDEX_PATH, "initiatives", scope);
}

/**
 * Get or create a Vectra index for the specified scope
 */
async function getIndex(scope: string): Promise<LocalIndex> {
	const cached = indexes.get(scope);
	if (cached) {
		return cached;
	}

	const indexPath = getIndexPath(scope);
	const index = new LocalIndex(indexPath);

	// Create index if it doesn't exist
	try {
		await index.getIndexStats();
	} catch {
		// Index doesn't exist, create it
		await mkdir(indexPath, { recursive: true });
		await index.createIndex();
		console.error(`Created new Vectra index at: ${indexPath}`);
	}

	indexes.set(scope, index);
	return index;
}

/**
 * Generate document ID for indexing
 */
function getDocumentId(scope: string, name: string): string {
	return `${scope}:${name}`;
}

/**
 * Calculate text relevance score (simple implementation)
 */
function calculateTextRelevance(card: MemoryCard, queryLower: string): number {
	const titleLower = card.title.toLowerCase();
	const contentLower = card.content.toLowerCase();
	const tagsLower = card.tags.map((tag) => tag.toLowerCase()).join(" ");

	let score = 0;

	// Title matches get higher score
	if (titleLower.includes(queryLower)) {
		score += 0.8;
	}

	// Content matches
	if (contentLower.includes(queryLower)) {
		score += 0.5;
	}

	// Tag matches
	if (tagsLower.includes(queryLower)) {
		score += 0.6;
	}

	// Word-by-word matching for partial matches
	const queryWords = queryLower.split(/\s+/);
	for (const word of queryWords) {
		if (word.length > 2) {
			// Skip short words
			if (titleLower.includes(word)) score += 0.2;
			if (contentLower.includes(word)) score += 0.1;
			if (tagsLower.includes(word)) score += 0.15;
		}
	}

	return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Convert Vectra query result to MemoryCardSearchResult
 */
function convertToSearchResult(
	metadata: Record<string, unknown>,
	distance: number,
): MemoryCardSearchResult | null {
	if (!metadata) return null;

	// Convert distance to relevance score (1 - distance, clamped to 0-1)
	const relevanceScore = Math.max(0, Math.min(1, 1 - distance));

	return {
		name: metadata.name as string,
		title: metadata.title as string,
		content: metadata.content as string,
		contextIncludingPolicy:
			(metadata.contextIncludingPolicy as "auto" | "always") || "auto",
		tags: JSON.parse((metadata.tags as string) || "[]"),
		relevanceScore,
	};
}

/**
 * Fallback text search when vector search is not available
 */
async function fallbackTextSearch(
	scope: string,
	query: string,
	limit = 5,
): Promise<MemoryCardSearchResult[]> {
	console.error("Using fallback text search");

	// Import here to avoid circular dependencies
	const { loadGlobalMemoryCards } = await import("./memory-cards.js");

	const queryLower = query.toLowerCase();
	const results: MemoryCardSearchResult[] = [];

	if (scope === "global") {
		const globalCards = await loadGlobalMemoryCards();
		for (const card of globalCards) {
			const relevanceScore = calculateTextRelevance(card, queryLower);
			if (relevanceScore > 0) {
				results.push({
					...card,
					relevanceScore,
				});
			}
		}
	} else {
		// Initiative scope search
		const { loadInitiativeMemoryCards } = await import("./memory-cards.js");
		const initiativeCards = await loadInitiativeMemoryCards(scope);
		for (const card of initiativeCards) {
			const relevanceScore = calculateTextRelevance(card, queryLower);
			if (relevanceScore > 0) {
				results.push({
					...card,
					relevanceScore,
				});
			}
		}
	}

	// Sort by relevance score and limit results
	return results
		.sort((a, b) => b.relevanceScore - a.relevanceScore)
		.slice(0, limit);
}

/**
 * Clear all vector indexes
 */
async function clearAllIndexes(): Promise<void> {
	try {
		// Remove all cached indexes
		indexes.clear();

		// Remove vector directory
		await rm(config.VECTOR_INDEX_PATH, { recursive: true, force: true });
		console.error(`Cleared all vector indexes at ${config.VECTOR_INDEX_PATH}`);
	} catch (error) {
		console.error("Failed to clear indexes:", error);
		// Don't throw, just log
	}
}

/**
 * Ensure the memory cards collection exists (for public API)
 * Replacement for ensureMemoryCardsCollection()
 */
export async function ensureMemoryCardsCollection(): Promise<void> {
	try {
		// Initialize embedding service
		await initializeEmbeddingService();

		// Ensure global index exists
		await getIndex("global");
	} catch (error) {
		console.error("Vector search not available, using fallback text search");
		console.error("Error details:", error);
	}
}

/**
 * Index a memory card in the vector database
 */
export async function indexMemoryCard(
	memoryCard: MemoryCard,
	scope: string,
): Promise<void> {
	try {
		// Ensure embedding service is initialized
		if (!isEmbeddingServiceReady()) {
			console.error("Embedding service not ready, skipping indexing");
			return;
		}

		const index = await getIndex(scope);
		const documentId = getDocumentId(scope, memoryCard.name);
		const searchableContent = `${memoryCard.title}\n\n${memoryCard.content}`;

		// Generate embedding
		const vector = await generateEmbedding(searchableContent);

		// Insert into index
		await index.insertItem({
			vector,
			metadata: {
				id: documentId,
				scope,
				name: memoryCard.name,
				title: memoryCard.title,
				content: memoryCard.content,
				contextIncludingPolicy: memoryCard.contextIncludingPolicy,
				tags: JSON.stringify(memoryCard.tags),
				searchableContent,
			},
		});

		console.error(`Indexed memory card '${memoryCard.name}' in ${scope} scope`);
	} catch (error) {
		console.error("Failed to index memory card:", error);
		// Don't throw error, just log it to avoid breaking main functionality
	}
}

/**
 * Remove a memory card from the vector index
 */
export async function removeFromIndex(
	scope: string,
	name: string,
): Promise<boolean> {
	try {
		const index = await getIndex(scope);

		// Query to find the item to remove
		const searchQuery = `name:${name}`;
		const results = await index.queryItems([], searchQuery, 1, { name });

		if (results.length === 0) {
			return false; // Document doesn't exist
		}

		// Delete the item
		const itemId = results[0]?.item?.id;
		if (itemId) {
			await index.deleteItem(itemId);
			console.error(
				`🗑️ Removed memory card '${name}' from ${scope} scope index`,
			);
			return true;
		}
		return false;
	} catch (error) {
		console.error("Failed to remove from index:", error);
		return false;
	}
}

/**
 * Search memory cards using semantic search
 */
export async function searchMemoryCards(
	scope: string,
	query: string,
	limit = 5,
): Promise<MemoryCardSearchResult[]> {
	try {
		if (!isEmbeddingServiceReady()) {
			// Fallback to text search
			return await fallbackTextSearch(scope, query, limit);
		}

		const index = await getIndex(scope);

		// Generate embedding for the query
		const queryVector = await generateEmbedding(query);

		// Perform semantic search
		const results = await index.queryItems(queryVector, query, limit);

		// Convert results to MemoryCardSearchResult format
		const searchResults: MemoryCardSearchResult[] = [];
		for (const result of results) {
			const metadata = result.item.metadata;
			if (metadata && metadata.scope === scope) {
				const searchResult = convertToSearchResult(metadata, result.score);
				if (searchResult) {
					searchResults.push(searchResult);
				}
			}
		}

		return searchResults;
	} catch (error) {
		console.error(
			"Failed to search memory cards, falling back to text search:",
			error,
		);
		return await fallbackTextSearch(scope, query, limit);
	}
}

/**
 * Re-index all existing memory cards (for initialization)
 */
export async function reindexAllMemoryCards(): Promise<void> {
	try {
		console.error("🔄 Re-indexing all memory cards...");

		// Clear existing indexes
		await clearAllIndexes();

		// Import here to avoid circular dependencies
		const { loadGlobalMemoryCards } = await import("./memory-cards.js");

		// Re-index global memory cards
		const globalCards = await loadGlobalMemoryCards();
		let indexedCount = 0;
		for (const card of globalCards) {
			await indexMemoryCard(card, "global");
			indexedCount++;
		}

		console.error(`✅ Re-indexed ${indexedCount} global memory cards`);

		// Re-index initiative memory cards
		// Note: We'll need to get list of initiative IDs
		// For now, this is a placeholder - actual implementation would need initiative enumeration
	} catch (error) {
		console.error("Failed to re-index memory cards:", error);
		throw error;
	}
}

/**
 * Get index statistics for debugging
 */
export async function getIndexStats(scope: string): Promise<object | null> {
	try {
		const index = await getIndex(scope);
		return await index.getIndexStats();
	} catch (error) {
		console.error(`Failed to get index stats for scope ${scope}:`, error);
		return null;
	}
}

/**
 * List available index scopes
 */
export async function listIndexScopes(): Promise<string[]> {
	try {
		const scopes = ["global"];

		// Check for initiative indexes
		const initiativesPath = path.join(config.VECTOR_INDEX_PATH, "initiatives");
		try {
			const initiativeDirs = await readdir(initiativesPath, {
				withFileTypes: true,
			});
			for (const dir of initiativeDirs) {
				if (dir.isDirectory()) {
					scopes.push(dir.name);
				}
			}
		} catch {
			// Initiatives directory doesn't exist yet
		}

		return scopes;
	} catch (error) {
		console.error("Failed to list index scopes:", error);
		return ["global"];
	}
}
