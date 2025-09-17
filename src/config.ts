// ABOUTME: Configuration module that loads and validates configuration from environment variables

import path from "node:path";
import { z } from "zod";

// Configuration schema using Zod
const configSchema = z.object({
	PROJECT_ROOT: z.string().min(1, "PROJECT_ROOT must be a non-empty path"),
	VECTOR_INDEX_PATH: z.string().optional(),
	EMBEDDING_MODEL: z.string().optional(),
	EMBEDDING_CACHE_DIR: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig() {
	const rawConfig = {
		PROJECT_ROOT: process.env.PROJECT_ROOT?.trim(),
		VECTOR_INDEX_PATH: process.env.VECTOR_INDEX_PATH?.trim(),
		EMBEDDING_MODEL: process.env.EMBEDDING_MODEL?.trim(),
		EMBEDDING_CACHE_DIR: process.env.EMBEDDING_CACHE_DIR?.trim(),
	};

	let validatedConfig: Config;
	try {
		validatedConfig = configSchema.parse(rawConfig);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const issues = error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join(", ");
			throw new Error(`Configuration validation failed: ${issues}`);
		}
		throw error;
	}

	// Derive vector database configuration with defaults
	return {
		...validatedConfig,
		VECTOR_INDEX_PATH:
			validatedConfig.VECTOR_INDEX_PATH ||
			path.join(validatedConfig.PROJECT_ROOT, "vector"),
		EMBEDDING_MODEL:
			validatedConfig.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
		EMBEDDING_CACHE_DIR:
			validatedConfig.EMBEDDING_CACHE_DIR ||
			path.join(
				validatedConfig.PROJECT_ROOT,
				"node_modules/@xenova/transformers/.cache",
			),
	};
}

// Export singleton config instance
export const config = loadConfig();
