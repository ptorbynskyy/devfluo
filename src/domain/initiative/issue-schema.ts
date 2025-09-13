// ABOUTME: Zod schemas for validating issue data structure within initiatives

import { z } from "zod";
import { EffortLevels } from "../backlog-schema.js";

// Issue resolution strategies
export const IssueStrategies = [
	"embed",
	"replan",
	"defer",
	"cancelInitiative",
] as const;

// Issue statuses
export const IssueStatuses = ["open", "closed"] as const;

// Zod schema for validating issue data structure
export const IssueSchema = z.object({
	id: z
		.string()
		.min(1)
		.regex(
			/^[a-z0-9-]+$/,
			"Issue ID must contain only lowercase letters, numbers, and hyphens",
		)
		.describe(
			"Unique identifier for the issue within initiative. Example: 'oauth-redirect-bug'",
		),
	name: z
		.string()
		.min(1)
		.describe(
			"Human readable name of the issue. Example: 'OAuth redirect bug'",
		),
	description: z
		.string()
		.min(1)
		.describe("Detailed description of the issue encountered"),
	recommendedStrategy: z
		.enum(IssueStrategies)
		.optional()
		.describe(
			"Recommended resolution strategy. Options: embed/replan/defer/cancelInitiative",
		),
	effortAssessment: z
		.enum(EffortLevels)
		.optional()
		.describe(
			"Effort assessment for resolving the issue. Options: S/M/L/XL/XXL",
		),
	tags: z
		.array(z.string())
		.default([])
		.describe("Array of tags for categorizing the issue"),
	status: z
		.enum(IssueStatuses)
		.default("open")
		.describe("Current status of the issue. Options: open/closed"),
	actualStrategy: z
		.enum(IssueStrategies)
		.optional()
		.describe(
			"The strategy that was actually implemented to resolve this issue. Options: embed/replan/defer/cancelInitiative",
		),
	summary: z
		.string()
		.optional()
		.describe(
			"Summary explaining why the chosen strategy was selected and how this should be considered for the knowledge base",
		),
});

// Schema for issue operations (create/update/delete)
export const IssueOperationsSchema = z.object({
	create: z
		.array(IssueSchema)
		.optional()
		.describe(
			'Array of complete issue objects to create. Example: [{"id": "oauth-bug", "name": "OAuth redirect issue", "description": "Google OAuth redirects to wrong URL", "tags": ["oauth", "google"], "status": "open", "actualStrategy": "embed", "summary": "Decided to embed fix directly in current sprint as it blocks user registration"}]',
		),
	update: z
		.record(z.string(), IssueSchema.omit({ id: true }).partial())
		.optional()
		.describe(
			'Object with issue IDs as keys and partial issue objects as values for updates. Example: {"oauth-bug": {"recommendedStrategy": "embed", "actualStrategy": "embed", "status": "closed", "summary": "Successfully embedded OAuth fix in authentication module"}}',
		),
	delete: z
		.array(z.string())
		.optional()
		.describe(
			'Array of issue IDs to delete. Example: ["oauth-bug", "performance-issue"]',
		),
});

export type Issue = z.infer<typeof IssueSchema>;
export type IssueOperations = z.infer<typeof IssueOperationsSchema>;
export type IssueStrategy = (typeof IssueStrategies)[number];
export type IssueStatus = (typeof IssueStatuses)[number];
