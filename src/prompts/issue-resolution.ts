// ABOUTME: Prompt for resolving initiative issues by asking user preferences and implementing chosen strategies

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	generateTasksMarkdownReport,
	loadInitiative,
} from "../domain/initiative/index.js";
import { IssueStrategies } from "../domain/initiative/issue-schema.js";
import { loadIssues } from "../domain/initiative/issues.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";
import { renderTemplateFile } from "../utils/template-engine.js";
import {
	createCompletableInitiativeId,
	initiativeIdSchema,
} from "./shared/initiative-id.js";
import {
	type InitiativeContext,
	loadInitiativeContext,
} from "./shared/project-context.js";

// Zod schema for issue resolution input validation
export const IssueResolutionInputSchema = z.object({
	initiativeId: initiativeIdSchema.describe(
		"ID of the initiative containing the issue to resolve",
	),
	issueId: z.string().min(1).describe("ID of the issue to resolve"),
	userChoice: z
		.enum(IssueStrategies)
		.optional()
		.describe(
			"User's chosen resolution strategy. If not provided, will show options and ask for choice. Options: embed/replan/defer/cancelInitiative",
		),
});

export type IssueResolutionInput = z.infer<typeof IssueResolutionInputSchema>;

export async function validateIssueForResolution(
	initiativeId: string,
	issueId: string,
) {
	const initiative = await loadInitiative(initiativeId);

	if (!initiative) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' does not exist. Please create it first using the initiative_create tool.`,
		);
	}

	if (initiative.state === "completed") {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' is already completed. Issues cannot be resolved for completed initiatives.`,
		);
	}

	// Load and find the specific issue
	const issues = await loadIssues(initiativeId);
	const issue = issues.find((i) => i.id === issueId);

	if (!issue) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Issue '${issueId}' does not exist in initiative '${initiativeId}'. Available issues: ${issues.map((i) => i.id).join(", ")}`,
		);
	}

	if (issue.status === "closed") {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Issue '${issueId}' is already closed. Only open issues can be resolved.`,
		);
	}

	return { initiative, issue };
}

export async function generateIssueResolutionPrompt(
	context: InitiativeContext,
	issueId: string,
	userChoice?: string,
): Promise<string> {
	const issue = context.issues.find((i) => i.id === issueId);
	if (!issue) {
		throw new Error(`Issue '${issueId}' not found in context`);
	}

	return await renderTemplateFile("issue-resolution.eta", {
		context,
		issue,
		userChoice,
		generateTasksMarkdownReport,
	});
}

export function setupIssueResolutionPrompt(server: McpServer): void {
	server.registerPrompt(
		"issue_resolution",
		{
			title: "resolve-initiative-issue",
			description:
				"Resolve an initiative issue by asking user preferences and implementing the chosen resolution strategy",
			argsSchema: {
				initiativeId: createCompletableInitiativeId(
					"ID of the initiative containing the issue to resolve",
				),
				issueId: IssueResolutionInputSchema.shape.issueId,
				userChoice: IssueResolutionInputSchema.shape.userChoice,
			},
		},
		async ({ initiativeId, issueId, userChoice }: IssueResolutionInput) => {
			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				// Validate initiative and issue
				const { initiative } = await validateIssueForResolution(
					initiativeId,
					issueId,
				);

				// Load full initiative context
				const context = await loadInitiativeContext(initiative);

				// Generate the prompt
				const promptText = await generateIssueResolutionPrompt(
					context,
					issueId,
					userChoice,
				);

				return {
					messages: [
						{
							role: "user" as const,
							content: {
								type: "text" as const,
								text: promptText,
							},
						},
					],
				};
			} catch (error) {
				if (error instanceof McpError) {
					throw error;
				}
				throw new McpError(
					ErrorCode.InternalError,
					`Failed to create issue resolution prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
