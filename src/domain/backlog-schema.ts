// ABOUTME: Zod schemas for validating backlog item data structure

import { z } from "zod";

// Effort levels for backlog items
export const EffortLevels = ["S", "M", "L", "XL", "XXL"] as const;

// Zod schema for validating backlog item data structure
export const BacklogItemSchema = z.object({
	id: z
		.string()
		.min(1)
		.regex(
			/^[a-z0-9-]+$/,
			"ID must contain only lowercase letters, numbers, and hyphens",
		)
		.describe(
			"Unique identifier for the backlog item (used for folder creation).",
		),
	name: z.string().min(1).describe("Human readable name of the backlog item."),
	description: z
		.string()
		.min(1)
		.describe("Overview description of the backlog item"),
	effort: z
		.enum(EffortLevels)
		.optional()
		.describe("Effort estimation for the backlog item."),
});

// Backlog item with spec content included
export const BacklogItemWithSpecSchema = BacklogItemSchema.extend({
	spec: z
		.string()
		.optional()
		.describe("Markdown content of the specification file (spec.md)"),
	hasSpec: z
		.boolean()
		.describe("Indicates whether spec.md file exists for this item"),
});

// Schema for backlog operations (create/update/delete)
export const BacklogOperationsSchema = z.object({
	create: z
		.array(
			BacklogItemSchema.extend({
				spec: z
					.string()
					.optional()
					.describe(
						"Optional markdown content for spec.md file. User should provide the content directly.",
					),
			}),
		)
		.optional()
		.describe("Array of complete backlog item objects to create."),
	update: z
		.record(
			z.string(),
			BacklogItemSchema.omit({ id: true })
				.partial()
				.extend({
					spec: z
						.string()
						.optional()
						.describe(
							"Optional markdown content for spec.md file. Provide directly by user or produced by brainstorming flow.",
						),
				}),
		)
		.optional()
		.describe(
			"Object with backlog item IDs as keys and partial backlog item objects as values for updates.",
		),
	delete: z
		.array(z.string())
		.optional()
		.describe("Array of backlog item IDs to delete."),
});

export type BacklogItem = z.infer<typeof BacklogItemSchema>;
export type BacklogItemWithSpec = z.infer<typeof BacklogItemWithSpecSchema>;
export type BacklogOperations = z.infer<typeof BacklogOperationsSchema>;
export type EffortLevel = (typeof EffortLevels)[number];
