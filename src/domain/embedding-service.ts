// ABOUTME: Local embedding service for generating vector embeddings using Transformers.js

import {
	env,
	type FeatureExtractionPipeline,
	pipeline,
} from "@xenova/transformers";
import { config } from "../config.js";

// Configuration for embedding model
const EMBEDDING_CONFIG = {
	model: config.EMBEDDING_MODEL, // Configurable model, defaults to all-MiniLM-L6-v2
	dimensions: 384, // Vector dimensions for all-MiniLM-L6-v2
	cacheDir: config.EMBEDDING_CACHE_DIR, // Configurable cache directory
} as const;

// Module-level state
let embedder: FeatureExtractionPipeline | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Configure Transformers.js for local use
env.allowRemoteModels = true; // Allow remote model loading for initial download
env.cacheDir = EMBEDDING_CONFIG.cacheDir;

/**
 * Initialize the embedding model
 * Safe to call multiple times - will use cached initialization promise
 */
export async function initializeEmbeddingService(): Promise<void> {
	if (embedder) {
		return; // Already initialized
	}

	if (isInitializing && initializationPromise) {
		return initializationPromise; // Initialization in progress
	}

	isInitializing = true;
	initializationPromise = performInitialization();

	try {
		await initializationPromise;
	} finally {
		isInitializing = false;
	}
}

async function performInitialization(): Promise<void> {
	try {
		console.error("Initializing local embedding service...");
		console.error(`Loading embedding model: ${EMBEDDING_CONFIG.model}`);
		console.error(`Cache directory: ${EMBEDDING_CONFIG.cacheDir}`);

		const startTime = Date.now();

		embedder = await pipeline("feature-extraction", EMBEDDING_CONFIG.model);

		const loadTime = Date.now() - startTime;
		console.error(`Embedding model loaded successfully in ${loadTime}ms`);
		console.error(`Model dimensions: ${EMBEDDING_CONFIG.dimensions}`);
	} catch (error) {
		console.error("Failed to initialize embedding model:", error);
		embedder = null;
		throw new Error(
			`Failed to initialize embedding model: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Generate embedding vector for given text
 * Automatically initializes model if not already done
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	if (!text.trim()) {
		throw new Error("Cannot generate embedding for empty text");
	}

	// Ensure model is initialized
	if (!embedder) {
		await initializeEmbeddingService();
	}

	if (!embedder) {
		throw new Error("Embedding model not available");
	}

	try {
		// Generate embedding using Transformers.js
		const output = await embedder(text, {
			pooling: "mean",
			normalize: true,
		});

		// Convert tensor data to number array
		const vector = Array.from(output.data);

		// Validate dimensions
		if (vector.length !== EMBEDDING_CONFIG.dimensions) {
			throw new Error(
				`Unexpected embedding dimensions: expected ${EMBEDDING_CONFIG.dimensions}, got ${vector.length}`,
			);
		}

		return vector;
	} catch (error) {
		console.error("Failed to generate embedding:", error);
		throw new Error(
			`Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Check if embedding service is ready
 */
export function isEmbeddingServiceReady(): boolean {
	return embedder !== null;
}
