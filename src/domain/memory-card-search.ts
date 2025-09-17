// ABOUTME: ChromaDB integration for semantic search of memory cards

import path from "node:path";
import { ChromaClient } from "chromadb";
import { config } from "../config.js";
import type { MemoryCard } from "./memory-card-schema.js";
import type { MemoryCardSearchResult } from "./memory-card-search-schema.js";

// ChromaDB storage path
export const chromaDbPath = path.join(config.PROJECT_ROOT, "chromadb");

// Collection name for memory cards
const MEMORY_CARDS_COLLECTION = "memory-cards";

let chromaClient: ChromaClient | null = null;
let isChromaAvailable = false;

// Initialize ChromaDB client
async function getChromaClient(): Promise<ChromaClient> {
	if (!chromaClient) {
		try {
			chromaClient = new ChromaClient({
				path: "http://localhost:8000",
			});
			// Test the connection
			await chromaClient.heartbeat();
			isChromaAvailable = true;
			console.log("✅ ChromaDB server connection established");
		} catch (error) {
			console.warn(
				"⚠️ ChromaDB server not available:",
				(error as Error).message,
			);
			console.warn(
				"💡 To use semantic search, start ChromaDB server: docker run -p 8000:8000 chromadb/chroma",
			);
			isChromaAvailable = false;
			throw new Error(
				"ChromaDB server not available. Semantic search disabled.",
			);
		}
	}
	return chromaClient;
}

// Get or create the memory cards collection
async function getMemoryCardsCollection() {
	const client = await getChromaClient();
	return client.getOrCreateCollection({
		name: MEMORY_CARDS_COLLECTION,
		metadata: { description: "Memory cards for semantic search" },
	});
}

// Ensure the memory cards collection exists (for public API)
export async function ensureMemoryCardsCollection() {
	try {
		await getChromaClient();
		if (isChromaAvailable) {
			await getMemoryCardsCollection();
			console.log("✅ ChromaDB collection ready");
		}
	} catch (_error) {
		console.warn("⚠️ ChromaDB not available, using fallback text search");
		// Don't throw error, fallback search will be used
	}
}

// Generate document ID for ChromaDB
function getDocumentId(scope: string, name: string): string {
	return `${scope}:${name}`;
}

// Index a memory card in ChromaDB
export async function indexMemoryCard(
	memoryCard: MemoryCard,
	scope: string,
): Promise<void> {
	try {
		if (!isChromaAvailable) {
			console.log("ChromaDB not available, skipping indexing");
			return;
		}

		const collection = await getMemoryCardsCollection();
		const documentId = getDocumentId(scope, memoryCard.name);
		const searchableContent = `${memoryCard.title}\n\n${memoryCard.content}`;

		// Add or update the document
		await collection.upsert({
			ids: [documentId],
			documents: [searchableContent],
			metadatas: [
				{
					scope,
					name: memoryCard.name,
					title: memoryCard.title,
					contextIncludingPolicy: memoryCard.contextIncludingPolicy,
					tags: JSON.stringify(memoryCard.tags),
				},
			],
		});
	} catch (error) {
		console.error("Failed to index memory card:", error);
		// Don't throw error, just log it to avoid breaking the main functionality
	}
}

// Remove a memory card from ChromaDB index
export async function removeFromIndex(
	scope: string,
	name: string,
): Promise<boolean> {
	try {
		const collection = await getMemoryCardsCollection();
		const documentId = getDocumentId(scope, name);

		// Check if document exists first
		const results = await collection.get({
			ids: [documentId],
		});

		if (results.ids.length === 0) {
			return false; // Document doesn't exist
		}

		// Delete the document
		await collection.delete({
			ids: [documentId],
		});

		return true;
	} catch (error) {
		console.error("Failed to remove from index:", error);
		return false;
	}
}

// Convert ChromaDB query result item to MemoryCardSearchResult
function convertToSearchResult(
	metadata: Record<string, unknown> | undefined,
	document: string | undefined,
	distance: number | undefined,
): MemoryCardSearchResult | null {
	if (!metadata) return null;

	// Convert distance to relevance score (1 - distance, clamped to 0-1)
	const relevanceScore = Math.max(0, Math.min(1, 1 - (distance || 1)));

	// Extract content (remove title from document since it's prepended)
	const content = document?.split("\n\n").slice(1).join("\n\n") || "";

	return {
		name: metadata.name as string,
		title: metadata.title as string,
		content,
		contextIncludingPolicy:
			(metadata.contextIncludingPolicy as "auto" | "always") || "auto",
		tags: JSON.parse(metadata.tags as string) || [],
		relevanceScore,
	};
}

// Search memory cards using semantic search
export async function searchMemoryCards(
	scope: string,
	query: string,
	limit = 5,
): Promise<MemoryCardSearchResult[]> {
	try {
		if (!isChromaAvailable) {
			// Fallback to simple text search
			return await fallbackTextSearch(scope, query, limit);
		}

		const collection = await getMemoryCardsCollection();

		// Perform semantic search with scope filtering
		const results = await collection.query({
			queryTexts: [query],
			nResults: limit,
			where: { scope },
		});

		const searchResults: MemoryCardSearchResult[] = [];

		if (results.ids.length > 0 && results.ids[0]) {
			for (let i = 0; i < results.ids[0].length; i++) {
				const metadata = results.metadatas?.[0]?.[i];
				const document = results.documents?.[0]?.[i];
				const distance = results.distances?.[0]?.[i];

				const searchResult = convertToSearchResult(
					metadata || undefined,
					document || undefined,
					distance,
				);
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

// Fallback text search when ChromaDB is not available
async function fallbackTextSearch(
	scope: string,
	query: string,
	limit = 5,
): Promise<MemoryCardSearchResult[]> {
	console.log("Using fallback text search");

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
		// Initiative scope search would go here
		// For now, return empty results for initiative scope
		console.warn("Initiative scope search not implemented in fallback mode");
	}

	// Sort by relevance score and limit results
	return results
		.sort((a, b) => b.relevanceScore - a.relevanceScore)
		.slice(0, limit);
}

// Calculate text relevance score (simple implementation)
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

// Re-index all existing memory cards (for initialization)
export async function reindexAllMemoryCards(): Promise<void> {
	try {
		const client = await getChromaClient();
		await client.deleteCollection({
			name: MEMORY_CARDS_COLLECTION,
		});

		// Import here to avoid circular dependencies
		const { loadGlobalMemoryCards } = await import("./memory-cards.js");

		// Re-index global memory cards
		const globalCards = await loadGlobalMemoryCards();
		for (const card of globalCards) {
			await indexMemoryCard(card, "global");
		}

		// Re-index initiative memory cards
		// Note: We'll need to get list of initiative IDs
		// For now, this is a placeholder - actual implementation would need initiative enumeration
		console.log(`Re-indexed ${globalCards.length} global memory cards`);
	} catch (error) {
		console.error("Failed to re-index memory cards:", error);
		throw error;
	}
}
