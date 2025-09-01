// ABOUTME: Development-related prompt templates for the MCP server

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	ErrorCode,
	GetPromptRequestSchema,
	ListPromptsRequestSchema,
	McpError,
} from "@modelcontextprotocol/sdk/types.js";

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

export function setupCodeReviewPrompt(server: Server): void {
	server.setRequestHandler(ListPromptsRequestSchema, async () => {
		return {
			prompts: [CODE_REVIEW_PROMPT],
		};
	});

	server.setRequestHandler(GetPromptRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;

		if (name === "code_review") {
			const language = (args?.language as string) || "TypeScript";
			const complexity = (args?.complexity as string) || "medium";

			return {
				description: "Code review checklist template",
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: generateCodeReviewPrompt(language, complexity),
						},
					},
				],
			};
		}

		throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
	});
}

export function setupBugReportPrompt(server: Server): void {
	server.setRequestHandler(ListPromptsRequestSchema, async () => {
		return {
			prompts: [BUG_REPORT_PROMPT],
		};
	});

	server.setRequestHandler(GetPromptRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;

		if (name === "bug_report") {
			const severity = (args?.severity as string) || "medium";

			return {
				description: "Bug report template",
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: generateBugReportPrompt(severity),
						},
					},
				],
			};
		}

		throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
	});
}
