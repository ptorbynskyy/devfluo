// ABOUTME: Index metadata management with hash-based consistency validation

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../../config.js";

/**
 * Index metadata structure
 */
export interface IndexMetadata {
	embeddingModel: string;
	lastRebuildTime: number;
	fileHashes: Record<string, string>; // name -> SHA256 hash of entire file
}

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
 * Get the metadata file path for an index
 */
function getIndexMetadataPath(scope: string): string {
	return path.join(getIndexPath(scope), "index-metadata.json");
}

/**
 * Generate SHA256 hash of file content
 */
export async function getFileHash(filePath: string): Promise<string> {
	try {
		const content = await readFile(filePath, "utf-8");
		return createHash("sha256").update(content).digest("hex");
	} catch {
		// Return empty hash for non-existent files
		return "";
	}
}

/**
 * Load index metadata
 */
export async function loadIndexMetadata(
	scope: string,
): Promise<IndexMetadata | null> {
	try {
		const metadataPath = getIndexMetadataPath(scope);
		const content = await readFile(metadataPath, "utf-8");
		return JSON.parse(content);
	} catch {
		return null;
	}
}

/**
 * Save index metadata
 */
export async function saveIndexMetadata(
	scope: string,
	metadata: IndexMetadata,
): Promise<void> {
	try {
		const metadataPath = getIndexMetadataPath(scope);
		await mkdir(path.dirname(metadataPath), { recursive: true });
		await writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
	} catch (error) {
		console.error("Failed to save index metadata:", error);
	}
}

/**
 * Create fresh metadata for current state
 */
export async function createFreshMetadata(
	_scope: string,
	cardPaths: Record<string, string>, // name -> filePath
): Promise<IndexMetadata> {
	const fileHashes: Record<string, string> = {};

	for (const [name, filePath] of Object.entries(cardPaths)) {
		fileHashes[name] = await getFileHash(filePath);
	}

	return {
		embeddingModel: config.EMBEDDING_MODEL,
		lastRebuildTime: Date.now(),
		fileHashes,
	};
}
