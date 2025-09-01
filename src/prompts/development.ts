// ABOUTME: Development-related prompt templates for the MCP server

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface PromptTemplate {
	name: string;
	description: string;
	arguments?: {
		name: string;
		description: string;
		required?: boolean;
	}[];
}

export const CODE_REVIEW_PROMPT: PromptTemplate = {
	name: "code_review",
	description: "Generate a code review template",
	arguments: [
		{
			name: "language",
			description: "Programming language of the code",
			required: false,
		},
		{
			name: "complexity",
			description: "Complexity level (simple, medium, complex)",
			required: false,
		},
	],
};

export const BUG_REPORT_PROMPT: PromptTemplate = {
	name: "bug_report",
	description: "Generate a bug report template",
	arguments: [
		{
			name: "severity",
			description: "Bug severity level",
			required: false,
		},
	],
};

export function generateCodeReviewPrompt(
	language = "TypeScript",
	complexity = "medium",
): string {
	return `# Code Review Checklist (${language} - ${complexity})

## Functionality
- [ ] Code meets the requirements
- [ ] Logic is correct and efficient
- [ ] Edge cases are handled

## Code Quality
- [ ] Code follows ${language} best practices
- [ ] Naming is clear and consistent
- [ ] Functions are appropriately sized
- [ ] Comments explain the why, not the what

## Security & Performance
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate

## Testing
- [ ] Unit tests cover key functionality
- [ ] Integration tests where needed
- [ ] Test cases cover edge cases`;
}

export function generateBugReportPrompt(severity = "medium"): string {
	return `# Bug Report Template (Severity: ${severity})

## Description
Brief description of the issue.

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS:
- Browser/Runtime:
- Version:

## Additional Context
Add any other context about the problem here.`;
}

export function setupCodeReviewPrompt(server: McpServer): void {
	server.registerPrompt(
		"code_review",
		{
			title: "Code Review Template",
			description: "Generate a code review template",
			argsSchema: {
				language: z.string().optional(),
				complexity: z.string().optional(),
			},
		},
		({
			language,
			complexity,
		}: {
			language?: string | undefined;
			complexity?: string | undefined;
		}) => ({
			messages: [
				{
					role: "user" as const,
					content: {
						type: "text" as const,
						text: generateCodeReviewPrompt(
							language || "TypeScript",
							complexity || "medium",
						),
					},
				},
			],
		}),
	);
}

export function setupBugReportPrompt(_server: McpServer): void {
	// server.registerPrompt(
	// 	"bug_report",
	// 	{
	// 		title: "Bug Report Template",
	// 		description: "Generate a bug report template",
	// 		argsSchema: {
	// 			severity: z.string().optional(),
	// 		},
	// 	},
	// 	({ severity }: { severity?: string | undefined }) => ({
	// 		messages: [
	// 			{
	// 				role: "user" as const,
	// 				content: {
	// 					type: "text" as const,
	// 					text: generateBugReportPrompt(severity || "medium"),
	// 				},
	// 			},
	// 		],
	// 	}),
	// );
}
