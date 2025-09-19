// ABOUTME: Memory card index orchestration with consistency validation and transparent rebuilding

import type { LocalIndex } from "vectra";
import { config } from "../config.js";
import {
	type ChunkMetadata,
	createChunkDocumentId,
	splitText,
} from "../utils/text-splitter.js";
import {
	ensureEmbeddingService,
	getIndex,
	indexDocument,
	removeIndex,
	removeMemoryCardChunks,
} from "./memory-card-index-core.js";
import {
	createFreshMetadata,
	getFileHash,
	loadIndexMetadata,
	saveIndexMetadata,
} from "./memory-card-index-metadata.js";
import type { MemoryCard } from "./memory-card-schema.js";
import {
	getMemoryCardPaths,
	loadGlobalMemoryCards,
	loadInitiativeMemoryCards,
} from "./memory-cards.js";

// Module-level state to prevent concurrent rebuilds
const rebuildingScopes: Set<string> = new Set();

/**
 * Validate index consistency using file hash comparison
 */
async function validateIndexConsistency(scope: string): Promise<boolean> {
	try {
		// Load current metadata
		const metadata = await loadIndexMetadata(scope);
		if (!metadata) {
			return false; // No metadata means index needs rebuild
		}

		// Check if embedding model changed
		if (metadata.embeddingModel !== config.EMBEDDING_MODEL) {
			console.error(
				`Embedding model changed from ${metadata.embeddingModel} to ${config.EMBEDDING_MODEL}`,
			);
			return false;
		}

		// Get current memory card file paths
		const currentPaths = await getMemoryCardPaths(scope);
		const currentNames = Object.keys(currentPaths);
		const indexedNames = Object.keys(metadata.fileHashes);

		// Check if card count matches
		if (currentNames.length !== indexedNames.length) {
			console.error(
				`Card count mismatch: index has ${indexedNames.length}, filesystem has ${currentNames.length}`,
			);
			return false;
		}

		// Check for new or deleted cards
		const currentNameSet = new Set(currentNames);
		const indexedNameSet = new Set(indexedNames);

		for (const name of currentNames) {
			if (!indexedNameSet.has(name)) {
				console.error(`New memory card detected: '${name}'`);
				return false;
			}
		}

		for (const name of indexedNames) {
			if (!currentNameSet.has(name)) {
				console.error(`Memory card deleted: '${name}'`);
				return false;
			}
		}

		// Check file hashes for content changes
		for (const [name, filePath] of Object.entries(currentPaths)) {
			const currentHash = await getFileHash(filePath);
			const indexedHash = metadata.fileHashes[name];

			if (currentHash !== indexedHash) {
				console.error(`Memory card '${name}' content changed`);
				return false;
			}
		}

		return true;
	} catch (error) {
		console.error("Error validating index consistency:", error);
		return false;
	}
}

/**
 * Index a memory card with chunking
 */
async function indexMemoryCardChunks(
	index: LocalIndex,
	memoryCard: MemoryCard,
	scope: string,
): Promise<number> {
	const searchableContent = `${memoryCard.title}\n\n${memoryCard.content}`;
	const chunks = splitText(searchableContent);

	// Index each chunk separately
	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i];
		if (!chunk) continue; // Skip empty chunks

		const chunkDocumentId = createChunkDocumentId(scope, memoryCard.name, i);
		const chunkMetadata: ChunkMetadata &
			Record<string, string | number | boolean> = {
			id: chunkDocumentId,
			cardName: memoryCard.name,
			scope,
			title: memoryCard.title ?? "",
			chunkIndex: i,
			totalChunks: chunks.length,
			tags: memoryCard.tags.join(","),
			contextIncludingPolicy: memoryCard.contextIncludingPolicy,
		};

		await indexDocument(index, chunkDocumentId, chunk, chunkMetadata);
	}

	return chunks.length;
}

/**
 * Rebuild index for a specific scope with hash tracking
 */
async function rebuildIndexForScope(scope: string): Promise<void> {
	if (rebuildingScopes.has(scope)) {
		console.error(`Index rebuild already in progress for scope: ${scope}`);
		return;
	}

	rebuildingScopes.add(scope);
	try {
		console.error(`🔄 Rebuilding index for scope: ${scope}`);

		// Clear existing index for this scope
		await removeIndex(scope);

		// Create new index
		const index = await getIndex(scope);

		// Get all memory cards for this scope
		const memoryCards =
			scope === "global"
				? await loadGlobalMemoryCards()
				: await loadInitiativeMemoryCards(scope);

		// Index all cards with chunking
		for (const card of memoryCards) {
			await indexMemoryCardChunks(index, card, scope);
		}

		// Create and save fresh metadata
		const cardPaths = await getMemoryCardPaths(scope);
		const metadata = await createFreshMetadata(scope, cardPaths);
		await saveIndexMetadata(scope, metadata);

		console.error(
			`✅ Rebuilt index for scope: ${scope} (${memoryCards.length} cards)`,
		);
	} catch (error) {
		console.error(`Failed to rebuild index for scope ${scope}:`, error);
		throw error;
	} finally {
		rebuildingScopes.delete(scope);
	}
}

/**
 * Ensure index consistency - validates and rebuilds if necessary
 */
export async function ensureIndexConsistency(scope: string): Promise<void> {
	try {
		// Ensure embedding service is ready
		await ensureEmbeddingService();

		// Skip if already rebuilding
		if (rebuildingScopes.has(scope)) {
			return;
		}

		// Check if index is consistent
		const isConsistent = await validateIndexConsistency(scope);

		if (!isConsistent) {
			console.error(
				`Index inconsistency detected for scope: ${scope}, triggering rebuild`,
			);
			await rebuildIndexForScope(scope);
		}
	} catch (error) {
		console.error(
			`Failed to ensure index consistency for scope ${scope}:`,
			error,
		);
		// Don't throw - allow fallback to text search
	}
}

/**
 * Index a single memory card with metadata update
 */
export async function indexMemoryCard(
	memoryCard: MemoryCard,
	scope: string,
): Promise<void> {
	try {
		// Ensure consistency first
		await ensureIndexConsistency(scope);

		const index = await getIndex(scope);

		// Index memory card chunks
		const chunkCount = await indexMemoryCardChunks(index, memoryCard, scope);
		console.error(
			`Splitting memory card '${memoryCard.name}' into ${chunkCount} chunks`,
		);

		// Update metadata for individual card
		await updateMetadataAfterIndexing(scope, memoryCard.name);

		console.error(
			`Indexed memory card '${memoryCard.name}' in ${scope} scope (${chunkCount} chunks)`,
		);
	} catch (error) {
		console.error("Failed to index memory card:", error);
		// Don't throw - this allows the calling code to continue
	}
}

/**
 * Remove memory card from index with metadata update
 */
export async function removeMemoryCardFromIndex(
	scope: string,
	name: string,
): Promise<boolean> {
	try {
		// Ensure consistency first
		await ensureIndexConsistency(scope);

		const index = await getIndex(scope);

		// Remove all chunks for this memory card
		const removedCount = await removeMemoryCardChunks(index, scope, name);

		if (removedCount > 0) {
			// Update metadata to reflect removal
			await updateMetadataAfterRemoval(scope, name);

			console.error(
				`🗑️ Removed memory card '${name}' from ${scope} scope index (${removedCount} chunks)`,
			);
			return true;
		}

		console.error(
			`No chunks found for memory card '${name}' in ${scope} scope`,
		);
		return false;
	} catch (error) {
		console.error("Failed to remove memory card from index:", error);
		return false;
	}
}

/**
 * Update metadata after indexing a single card
 */
async function updateMetadataAfterIndexing(
	scope: string,
	cardName: string,
): Promise<void> {
	try {
		const cardPaths = await getMemoryCardPaths(scope);
		const existingMetadata = await loadIndexMetadata(scope);

		if (existingMetadata && cardPaths[cardName]) {
			// Update existing metadata with new hash
			existingMetadata.fileHashes[cardName] = await getFileHash(
				cardPaths[cardName],
			);
			existingMetadata.embeddingModel = config.EMBEDDING_MODEL;
			await saveIndexMetadata(scope, existingMetadata);
		} else {
			// Create fresh metadata if it doesn't exist
			const metadata = await createFreshMetadata(scope, cardPaths);
			await saveIndexMetadata(scope, metadata);
		}
	} catch (error) {
		console.error("Failed to update metadata after indexing:", error);
	}
}

/**
 * Update metadata after removing a card
 */
async function updateMetadataAfterRemoval(
	scope: string,
	cardName: string,
): Promise<void> {
	try {
		const existingMetadata = await loadIndexMetadata(scope);

		if (existingMetadata) {
			delete existingMetadata.fileHashes[cardName];
			await saveIndexMetadata(scope, existingMetadata);
		}
	} catch (error) {
		console.error("Failed to update metadata after removal:", error);
	}
}
