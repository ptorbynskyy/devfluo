// ABOUTME: Zod schemas for validating solution data structure

import { z } from "zod";

// Zod schema for validating solution data structure
export const SolutionSchema = z.object({
	problem: z.string().describe("Description of the problem being solved"),
	solution: z.string().describe("Description of the solution approach"),
	tags: z
		.array(z.string())
		.describe("Array of tags associated with the solution"),
	codeReferences: z
		.array(z.string())
		.max(3, "Provide at most 3 reference examples")
		.optional()
		.describe(
			"Array of 2-3 example locations in the codebase where this solution is well-implemented, serving as reference for applying the solution elsewhere. Format: 'path:line' or 'path:startLine-endLine'",
		),
});

export const SolutionsArraySchema = z.array(SolutionSchema);

export const SolutionStoreSchema = z.object({
	solutions: SolutionsArraySchema,
});

// Solution operations schema for create, update, and delete operations
export const SolutionOperationsSchema = z.object({
	create: z
		.array(SolutionSchema)
		.optional()
		.describe(
			"Array of complete solution objects to create. The codeReferences should contain 2-3 examples of where this solution is well-implemented in the target codebase.",
		),
	update: z
		.record(z.string(), SolutionSchema.partial())
		.optional()
		.describe(
			"Object with solution identifiers as keys and partial solution objects as values for updates. The codeReferences should contain 2-3 examples of where this solution is well-implemented.",
		),
	delete: z
		.array(z.string())
		.optional()
		.describe("Array of solution identifiers to delete."),
});

export type Solution = z.infer<typeof SolutionSchema>;
export type Solutions = z.infer<typeof SolutionsArraySchema>;
export type SolutionOperations = z.infer<typeof SolutionOperationsSchema>;
