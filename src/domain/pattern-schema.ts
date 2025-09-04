// ABOUTME: Zod schemas for validating pattern data structure

import { z } from "zod";

// Zod schema for validating pattern data structure
export const PatternSchema = z.object({
	name: z.string().describe("The name of the pattern"),
	description: z.string().describe("The description of the pattern"),
	tags: z
		.array(z.string())
		.describe("Array of tags associated with the pattern"),
	snippetFilename: z
		.string()
		.describe("Filename of the code snippet stored in patterns folder"),
	codeReferences: z
		.array(z.string())
		.describe(
			"Array of code references in format 'path:line' or 'path:startLine-endLine'",
		),
});

export const PatternsArraySchema = z.array(PatternSchema);

export const PatternStoreSchema = z.object({
	patterns: PatternsArraySchema,
});

// Pattern operations schema for create, update, and delete operations
export const PatternOperationsSchema = z.object({
	create: z
		.array(PatternSchema)
		.optional()
		.describe(
			'Array of complete pattern objects to create. Example: [{"name": "pattern-crud", "description": "CRUD operations for patterns", "tags": ["domain", "crud"], "snippetFilename": "pattern-pattern.ts", "codeReferences": ["src/domain/patterns.ts:14-24"]}]',
		),
	update: z
		.record(z.string(), PatternSchema.partial())
		.optional()
		.describe(
			'Object with pattern names as keys and partial pattern objects as values for updates. Example: {"pattern-crud": {"description": "Updated description"}}',
		),
	delete: z
		.array(z.string())
		.optional()
		.describe(
			'Array of pattern names to delete. Example: ["old-pattern", "deprecated-pattern"]',
		),
});

export type Pattern = z.infer<typeof PatternSchema>;
export type Patterns = z.infer<typeof PatternsArraySchema>;
export type PatternOperations = z.infer<typeof PatternOperationsSchema>;
