// ABOUTME: Zod schemas for validating issue data structure within initiatives

import matter from "gray-matter";
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
		.describe("Unique identifier for the issue within initiative."),
	name: z.string().min(1).describe("Human readable name of the issue."),
	description: z
		.string()
		.min(1)
		.describe("Detailed description of the issue encountered"),
	recommendedStrategy: z
		.enum(IssueStrategies)
		.optional()
		.describe("Recommended resolution strategy."),
	effortAssessment: z
		.enum(EffortLevels)
		.optional()
		.describe("Effort assessment for resolving the issue."),
	tags: z
		.array(z.string())
		.default([])
		.describe("Array of tags for categorizing the issue"),
	status: z
		.enum(IssueStatuses)
		.default("open")
		.describe("Current status of the issue."),
	actualStrategy: z
		.enum(IssueStrategies)
		.optional()
		.describe(
			"The strategy that was actually implemented to resolve this issue.",
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
		.describe("Array of complete issue objects to create."),
	update: z
		.record(z.string(), IssueSchema.omit({ id: true }).partial())
		.optional()
		.describe(
			"Object with issue IDs as keys and partial issue objects as values for updates.",
		),
	delete: z
		.array(z.string())
		.optional()
		.describe("Array of issue IDs to delete."),
});

export type Issue = z.infer<typeof IssueSchema>;
export type IssueOperations = z.infer<typeof IssueOperationsSchema>;
export type IssueStrategy = (typeof IssueStrategies)[number];
export type IssueStatus = (typeof IssueStatuses)[number];

// Parse issue from Markdown file content with front matter
export function parseIssueFromFile(
	issueId: string,
	fileContent: string,
): Issue {
	const { data, content } = matter(fileContent);

	return IssueSchema.parse({
		id: issueId,
		name: data.name,
		description: content.trim(),
		recommendedStrategy: data.recommendedStrategy,
		effortAssessment: data.effortAssessment,
		tags: data.tags || [],
		status: data.status || "open",
		actualStrategy: data.actualStrategy,
		summary: data.summary,
	});
}

// Generate Markdown file content with front matter from issue
export function issueToMarkdownContent(issue: Issue): string {
	const frontmatter = {
		name: issue.name,
		recommendedStrategy: issue.recommendedStrategy,
		effortAssessment: issue.effortAssessment,
		tags: issue.tags,
		status: issue.status,
		actualStrategy: issue.actualStrategy,
		summary: issue.summary,
	};

	return matter.stringify(issue.description, frontmatter);
}
