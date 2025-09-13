// ABOUTME: Prompt for analyzing initiative scope changes and recommending resolution strategies

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	generateTasksMarkdownReport,
	loadInitiative,
} from "../domain/initiative/index.js";
import { renderTemplateFile } from "../utils/template-engine.js";
import {
	createCompletableInitiativeId,
	initiativeIdSchema,
} from "./shared/initiative-id.js";
import {
	type InitiativeContext,
	loadInitiativeContext,
} from "./shared/project-context.js";

// Zod schema for scope change input validation
export const ScopeChangeInputSchema = z.object({
	initiativeId: initiativeIdSchema.describe(
		"ID of the initiative experiencing scope change",
	),
	issueDescription: z
		.string()
		.min(1)
		.describe("Description of the new issue to analyze"),
});

export type ScopeChangeInput = z.infer<typeof ScopeChangeInputSchema>;

export async function validateInitiativeForScopeChange(initiativeId: string) {
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
			`Initiative '${initiativeId}' is already completed. Scope changes cannot be analyzed for completed initiatives.`,
		);
	}

	return { initiative };
}

export async function generateScopeChangePrompt(
	context: InitiativeContext,
	issueDescription?: string,
): Promise<string> {
	return await renderTemplateFile("initiative-scope-change.eta", {
		context,
		issueDescription,
		generateTasksMarkdownReport,
	});
}

export function setupInitiativeScopeChangePrompt(server: McpServer): void {
	server.registerPrompt(
		"initiative_scope_change",
		{
			title: "analyze-initiative-scope-change",
			description:
				"Analyze scope changes and issues in an initiative to recommend resolution strategies",
			argsSchema: {
				initiativeId: createCompletableInitiativeId(
					"ID of the initiative experiencing scope change",
				),
				issueDescription: ScopeChangeInputSchema.shape.issueDescription,
			},
		},
		async ({ initiativeId, issueDescription }: ScopeChangeInput) => {
			try {
				// Validate initiative
				const { initiative } =
					await validateInitiativeForScopeChange(initiativeId);

				// Load full initiative context including existing issues
				const context = await loadInitiativeContext(initiative);

				// Generate the prompt
				const promptText = await generateScopeChangePrompt(
					context,
					issueDescription,
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
					`Failed to create scope change analysis prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
