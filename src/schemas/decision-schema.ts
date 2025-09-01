import { z } from "zod";

// Zod schema for validating decision data structure
export const DecisionSchema = z.object({
	name: z.string().describe("The name of the decisiosn"),
	description: z.string().describe("The description of the decision"),
	tags: z
		.array(z.string())
		.describe("Array of tags associated with the decision"),
});

export const DecisionsArraySchema = z.array(DecisionSchema);

export const DesitionStoreSchema = z.object({
	desitions: DecisionsArraySchema,
});

export type Decision = z.infer<typeof DecisionSchema>;
export type Decisions = z.infer<typeof DecisionsArraySchema>;
