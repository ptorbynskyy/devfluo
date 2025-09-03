import { z } from "zod";

// Zod schema for validating decision data structure
export const DecisionSchema = z.object({
	name: z.string().describe("The name of the decision"),
	description: z.string().describe("The description of the decision"),
	tags: z
		.array(z.string())
		.describe("Array of tags associated with the decision"),
});

export const DecisionsArraySchema = z.array(DecisionSchema);

export const DecisionStoreSchema = z.object({
	decisions: DecisionsArraySchema,
});

// Decision operations schema for create, update, and delete operations
export const DecisionOperationsSchema = z.object({
	create: z
		.array(DecisionSchema)
		.optional()
		.describe(
			'Array of complete decision objects to create. Example: [{"name": "use-typescript", "description": "Use TypeScript for type safety", "tags": ["language", "types"]}]',
		),
	update: z
		.record(z.string(), DecisionSchema.partial())
		.optional()
		.describe(
			'Object with decision names as keys and partial decision objects as values for updates. Example: {"use-typescript": {"description": "Updated description"}}',
		),
	delete: z
		.array(z.string())
		.optional()
		.describe(
			'Array of decision names to delete. Example: ["old-decision", "deprecated-choice"]',
		),
});

export type Decision = z.infer<typeof DecisionSchema>;
export type Decisions = z.infer<typeof DecisionsArraySchema>;
export type DecisionOperations = z.infer<typeof DecisionOperationsSchema>;
