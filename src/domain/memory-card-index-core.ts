// ABOUTME: Pure vector operations for memory card indexing using Vectra

import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { LocalIndex } from "vectra";
import { config } from "../config.js";
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
): Promise<Array<{ name: string; scope: string; score: number }>> {
	if (!isEmbeddingServiceReady()) {
		throw new Error("Embedding service not ready");
	}

	const queryEmbedding = await generateEmbedding(query);
	const results = await index.queryItems(queryEmbedding, "", limit);

	return results
		.filter(
			(result) => result.item?.metadata?.scope && result.item?.metadata?.name,
		)
		.map((result) => ({
			name: result.item?.metadata?.name as string,
			scope: result.item?.metadata?.scope as string,
			score: result.score,
		}));
}

/**
 * Remove a document from vector index
 */
export async function removeDocument(
	index: LocalIndex,
	documentId: string,
): Promise<boolean> {
	try {
		await index.deleteItem(documentId);
		return true;
	} catch {
		return false;
	}
}

export async function removeIndex(scope: string) {
	const indexPath = getIndexPath(scope);
	await rm(indexPath, { recursive: true, force: true });
	indexes.delete(scope);
}
