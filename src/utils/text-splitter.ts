// ABOUTME: Text splitting utility for chunking large content to fit embedding model token limits

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Configuration for text splitting
 */
export interface TextSplitterConfig {
	/** Maximum characters per chunk (approximate tokens * 4) */
	chunkSize: number;
	/** Overlap between chunks to preserve context */
	chunkOverlap: number;
}

/**
 * Default configuration for memory card chunking
 * Uses LangChain's optimized defaults for balanced context and granularity
 */
export const DEFAULT_CONFIG: TextSplitterConfig = {
	chunkSize: 1000, // ~250 tokens (assuming 4 chars per token)
	chunkOverlap: 200, // ~50 tokens overlap
};

/**
 * Split text into chunks that respect token limits using LangChain's RecursiveCharacterTextSplitter
 * Uses LangChain's default separators: ["\n\n", "\n", " ", ""] for optimal semantic preservation
 */
export async function splitText(
	text: string,
	config: TextSplitterConfig = DEFAULT_CONFIG,
): Promise<string[]> {
	if (!text.trim()) {
		return [];
	}

	// If text is already small enough, return as single chunk
	if (text.length <= config.chunkSize) {
		return [text];
	}

	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: config.chunkSize,
		chunkOverlap: config.chunkOverlap,
		// Use LangChain's default separators for better semantic coherence
	});

	const chunks = await splitter.splitText(text);
	return chunks.filter((chunk) => chunk.trim().length > 0);
}

/**
 * Generate chunk metadata for indexing
 */
export interface ChunkMetadata {
	cardName: string;
	scope: string;
	title: string;
	chunkIndex: number;
	totalChunks: number;
}

/**
 * Create chunk document ID for vector index
 */
export function createChunkDocumentId(
	scope: string,
	cardName: string,
	chunkIndex: number,
): string {
	return `${scope}::${cardName}::chunk${chunkIndex}`;
}

/**
 * Parse chunk document ID to extract metadata
 */
export function parseChunkDocumentId(documentId: string): {
	scope: string;
	cardName: string;
	chunkIndex: number;
} | null {
	const match = documentId.match(/^(.+?)::(.+?)::chunk(\d+)$/);
	if (!match || !match[1] || !match[2] || !match[3]) {
		return null;
	}

	return {
		scope: match[1],
		cardName: match[2],
		chunkIndex: parseInt(match[3], 10),
	};
}

/**
 * Check if document ID represents a chunk
 */
export function isChunkDocumentId(documentId: string): boolean {
	return /::chunk\d+$/.test(documentId);
}
