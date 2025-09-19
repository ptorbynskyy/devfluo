// ABOUTME: Text splitting utility for chunking large content to fit embedding model token limits

/**
 * Configuration for text splitting
 */
export interface TextSplitterConfig {
	/** Maximum characters per chunk (approximate tokens * 4) */
	chunkSize: number;
	/** Overlap between chunks to preserve context */
	chunkOverlap: number;
	/** Separators to use for splitting, in order of preference */
	separators: string[];
}

/**
 * Default configuration for memory card chunking
 * Targets ~400 tokens per chunk with some overlap for context preservation
 */
export const DEFAULT_CONFIG: TextSplitterConfig = {
	chunkSize: 1600, // ~400 tokens (assuming 4 chars per token)
	chunkOverlap: 200, // ~50 tokens overlap
	separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
};

/**
 * Split text into chunks that respect token limits
 */
export function splitText(
	text: string,
	config: TextSplitterConfig = DEFAULT_CONFIG,
): string[] {
	if (!text.trim()) {
		return [];
	}

	// If text is already small enough, return as single chunk
	if (text.length <= config.chunkSize) {
		return [text];
	}

	const chunks: string[] = [];
	const splits = recursiveSplit(text, config.separators, config.chunkSize);

	let currentChunk = "";

	for (const split of splits) {
		// If adding this split would exceed chunk size
		if (currentChunk.length + split.length > config.chunkSize) {
			// If we have content, save current chunk
			if (currentChunk.trim()) {
				chunks.push(currentChunk.trim());

				// Start new chunk with overlap from previous chunk
				if (
					config.chunkOverlap > 0 &&
					currentChunk.length > config.chunkOverlap
				) {
					const overlapText = currentChunk.slice(-config.chunkOverlap);
					currentChunk = overlapText + split;
				} else {
					currentChunk = split;
				}
			} else {
				// If split itself is too large, force add it
				currentChunk = split;
			}
		} else {
			currentChunk += split;
		}
	}

	// Add final chunk if it has content
	if (currentChunk.trim()) {
		chunks.push(currentChunk.trim());
	}

	return chunks.filter((chunk) => chunk.trim().length > 0);
}

/**
 * Recursively split text using separators in order of preference
 */
function recursiveSplit(
	text: string,
	separators: string[],
	chunkSize: number,
): string[] {
	if (!text) {
		return [];
	}

	const separator = separators[0];
	const otherSeparators = separators.slice(1);

	let splits: string[];

	if (separator === "") {
		// Final fallback: split by character
		splits = text.split("");
	} else if (separator) {
		splits = text.split(separator);
	} else {
		splits = [text];
	}

	// If we have multiple separators remaining, try to split large pieces further
	if (otherSeparators.length > 0) {
		const finalSplits: string[] = [];

		for (const split of splits) {
			if (split.length > chunkSize) {
				// This piece is still too large, split it further
				const subSplits = recursiveSplit(split, otherSeparators, chunkSize);
				finalSplits.push(...subSplits);
			} else {
				finalSplits.push(split);
			}
		}

		return finalSplits;
	}

	return splits;
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
