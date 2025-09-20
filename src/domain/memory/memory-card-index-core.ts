// ABOUTME: Pure vector operations for memory card indexing using Vectra

import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { LocalIndex } from "vectra";
import { config } from "../../config.js";
import {
	generateEmbedding,
	initializeEmbeddingService,
	isEmbeddingServiceReady,
} from "./embedding-service.js";

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
export async function getIndex(scope: string): Promise<LocalIndex> {
	const existing = indexes.get(scope);
	if (existing) {
		return existing;
	}

	const indexPath = getIndexPath(scope);
	await mkdir(indexPath, { recursive: true });

	const index = new LocalIndex(indexPath);

	// Check if the index exists and needs to be created
	if (!(await index.isIndexCreated())) {
		await index.createIndex();
	}

	indexes.set(scope, index);
	return index;
}

/**
 * Initialize embedding service
 */
export async function ensureEmbeddingService(): Promise<void> {
	if (!isEmbeddingServiceReady()) {
		await initializeEmbeddingService();
	}
}

/**
 * Index a single memory card in vector database
 */
export async function indexDocument(
	index: LocalIndex,
	documentId: string,
	content: string,
	metadata: Record<string, number | string | boolean>,
): Promise<void> {
	if (!isEmbeddingServiceReady()) {
		throw new Error("Embedding service not ready");
	}

	const embedding = await generateEmbedding(content);

	await index.insertItem({
		id: documentId,
		vector: embedding,
		metadata: {
			...metadata,
			content, // Store the content in metadata for retrieval
		},
	});
}

/**
 * Search for similar documents in vector database
 */
export async function searchIndex(
	index: LocalIndex,
	query: string,
	limit: number,
): Promise<
	Array<{
		cardName: string;
		scope: string;
		score: number;
		chunkIndex: number;
		totalChunks: number;
		chunkContent: string;
	}>
> {
	if (!isEmbeddingServiceReady()) {
		throw new Error("Embedding service not ready");
	}

	const queryEmbedding = await generateEmbedding(query);
	const results = await index.queryItems(queryEmbedding, "", limit);

	return results
		.filter(
			(result) =>
				result.item?.metadata?.scope && result.item?.metadata?.cardName,
		)
		.map((result) => ({
			cardName: result.item?.metadata?.cardName as string,
			scope: result.item?.metadata?.scope as string,
			score: result.score,
			chunkIndex: result.item?.metadata?.chunkIndex as number,
			totalChunks: result.item?.metadata?.totalChunks as number,
			chunkContent: (result.item?.metadata?.content as string) ?? "",
		}));
}

/**
 * Remove all chunks for a specific memory card
 */
export async function removeMemoryCardChunks(
	index: LocalIndex,
	scope: string,
	cardName: string,
): Promise<number> {
	try {
		// Query for all items with matching cardName metadata
		const allItems = await index.listItems();
		let removedCount = 0;

		for (const item of allItems) {
			if (
				item.metadata?.cardName === cardName &&
				item.metadata?.scope === scope
			) {
				try {
					await index.deleteItem(item.id);
					removedCount++;
				} catch (error) {
					console.error(`Failed to delete chunk ${item.id}:`, error);
				}
			}
		}

		return removedCount;
	} catch (error) {
		console.error(`Failed to remove chunks for card '${cardName}':`, error);
		return 0;
	}
}

export async function removeIndex(scope: string) {
	const indexPath = getIndexPath(scope);
	await rm(indexPath, { recursive: true, force: true });
	indexes.delete(scope);
}
