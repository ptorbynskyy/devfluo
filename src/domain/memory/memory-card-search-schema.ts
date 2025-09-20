// ABOUTME: Zod schemas for validating memory card search operations

import { z } from "zod";
import { MemoryCardSchema } from "./memory-card-schema.js";

// Schema for memory card search input
export const MemoryCardSearchSchema = z.object({
	scope: z
		.union([z.literal("global"), z.string()])
		.describe(
			"Scope: 'global' for global scope or initiative ID for initiative scope",
		),
	query: z.string().describe("The search query for semantic search"),
	limit: z
		.number()
		.int()
		.positive()
		.max(20)
		.optional()
		.default(5)
		.describe("Maximum number of results to return (default: 5, max: 20)"),
});

// Schema for memory card search result item
export const MemoryCardSearchResultSchema = MemoryCardSchema.extend({
	relevanceScore: z
		.number()
		.min(0)
		.max(1)
		.describe("Relevance score from semantic search (0-1)"),
});

export type MemoryCardSearch = z.infer<typeof MemoryCardSearchSchema>;
export type MemoryCardSearchResult = z.infer<
	typeof MemoryCardSearchResultSchema
>;
