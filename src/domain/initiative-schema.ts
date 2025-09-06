// ABOUTME: Zod schemas for validating initiative data structure

import { z } from "zod";

// Initiative states
export const InitiativeStates = ["new", "inprogress", "completed"] as const;

// Zod schema for validating initiative data structure
export const InitiativeSchema = z.object({
	id: z
		.string()
		.min(1)
		.regex(
			/^[a-z0-9-]+$/,
			"ID must contain only lowercase letters, numbers, and hyphens",
		)
		.describe(
			"Unique identifier for the initiative (used for folder creation). Example: 'user-auth'",
		),
	name: z
		.string()
		.min(1)
		.describe(
			"Human readable name of the initiative. Example: 'User Authentication System'",
		),
	state: z
		.enum(InitiativeStates)
		.default("new")
		.describe(
			"Current state of the initiative. Options: new/inprogress/completed",
		),
});

// Initiative with overview content included
export const InitiativeWithOverviewSchema = InitiativeSchema.extend({
	overview: z
		.string()
		.optional()
		.describe("Markdown content of the overview file (overview.md)"),
	hasOverview: z
		.boolean()
		.describe("Indicates whether overview.md file exists for this initiative"),
});

// Schema for creating a new initiative
export const InitiativeCreateSchema = z.object({
	id: z
		.string()
		.min(1)
		.regex(
			/^[a-z0-9-]+$/,
			"ID must contain only lowercase letters, numbers, and hyphens",
		)
		.describe("Unique identifier for the initiative. Example: 'user-auth'"),
	name: z
		.string()
		.min(1)
		.describe(
			"Human readable name of the initiative. Example: 'User Authentication System'",
		),
	overview: z
		.string()
		.optional()
		.describe(
			"Optional markdown content for overview.md file. Example: '# User Authentication\\n\\nThis initiative covers...'",
		),
});

// Schema for updating an existing initiative
export const InitiativeUpdateSchema = z.object({
	id: z.string().min(1).describe("ID of the initiative to update"),
	name: z.string().min(1).optional().describe("Updated name of the initiative"),
	state: z
		.enum(InitiativeStates)
		.optional()
		.describe(
			"Updated state of the initiative. Options: new/inprogress/completed",
		),
	overview: z
		.string()
		.optional()
		.describe("Updated markdown content for overview.md file"),
});

// Schema for deleting an initiative
export const InitiativeDeleteSchema = z.object({
	id: z
		.string()
		.min(1)
		.describe("ID of the initiative to delete. Example: 'user-auth'"),
});

export type Initiative = z.infer<typeof InitiativeSchema>;
export type InitiativeWithOverview = z.infer<
	typeof InitiativeWithOverviewSchema
>;
export type InitiativeCreateInput = z.infer<typeof InitiativeCreateSchema>;
export type InitiativeUpdateInput = z.infer<typeof InitiativeUpdateSchema>;
export type InitiativeDeleteInput = z.infer<typeof InitiativeDeleteSchema>;
export type InitiativeState = (typeof InitiativeStates)[number];
