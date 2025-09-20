// ABOUTME: Zod schemas for validating memory card data structure

import { z } from "zod";

// Zod schema for validating memory card data structure
export const MemoryCardSchema = z.object({
	name: z.string().describe("The name of the memory card (used as filename)"),
	title: z.string().describe("The title of the memory card"),
	content: z.string().describe("The markdown content of the memory card"),
	contextIncludingPolicy: z
		.enum(["auto", "always"])
		.default("auto")
		.describe("When to include this memory card in context (auto/always)"),
	tags: z
		.array(z.string())
		.describe("Array of tags associated with the memory card"),
});

// Schema for memory card add/update tool
export const MemoryCardAddOrUpdateSchema = z.object({
	scope: z
		.union([z.literal("global"), z.string()])
		.describe(
			"Scope: 'global' for global scope or initiative ID for initiative scope",
		),
	name: z.string().describe("The name of the memory card (used as filename)"),
	title: z.string().describe("The title of the memory card"),
	content: z.string().describe("The markdown content of the memory card"),
	contextIncludingPolicy: z
		.enum(["auto", "always"])
		.optional()
		.default("auto")
		.describe("When to include this memory card in context (auto/always)"),
	tags: z
		.array(z.string())
		.describe("Array of tags associated with the memory card"),
});

// Schema for memory card remove tool
export const MemoryCardRemoveSchema = z.object({
	scope: z
		.union([z.literal("global"), z.string()])
		.describe(
			"Scope: 'global' for global scope or initiative ID for initiative scope",
		),
	name: z.string().describe("The name of the memory card to remove"),
});

export type MemoryCard = z.infer<typeof MemoryCardSchema>;
export type MemoryCardAddOrUpdate = z.infer<typeof MemoryCardAddOrUpdateSchema>;
export type MemoryCardRemove = z.infer<typeof MemoryCardRemoveSchema>;
