// ABOUTME: Prompt for collecting knowledge from manual changes and agent guidance during initiative work

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadInitiative } from "../domain/initiative/index.js";
import { renderTemplateFile } from "../utils/template-engine.js";
import {
	createCompletableInitiativeId,
	initiativeIdSchema,
} from "./shared/initiative-id.js";

// Zod schema for knowledge collection input validation
export const KnowledgeCollectionInputSchema = z.object({
	initiativeId: initiativeIdSchema.describe(
		"ID of the initiative to collect knowledge for",
	),
});

export type KnowledgeCollectionInput = z.infer<
	typeof KnowledgeCollectionInputSchema
>;

export async function validateInitiativeForKnowledgeCollection(
	initiativeId: string,
) {
	const initiative = await loadInitiative(initiativeId);

	if (!initiative) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' does not exist. Please create it first using the initiative_create tool.`,
		);
	}

	return initiative;
}

export async function generateKnowledgeCollectionPrompt(
	initiativeId: string,
): Promise<string> {
	return await renderTemplateFile("initiative-knowledge-collection.eta", {
		initiativeId,
	});
}

export function setupInitiativeKnowledgeCollectionPrompt(
	server: McpServer,
): void {
	server.registerPrompt(
		"initiative_knowledge_collection",
		{
			title: "collect-initiative-knowledge",
			description:
				"Collect decisions, solutions, and patterns from manual changes and agent guidance during initiative work",
			argsSchema: {
				initiativeId: createCompletableInitiativeId(
					"ID of the initiative to collect knowledge for",
				),
			},
		},
		async ({ initiativeId }: KnowledgeCollectionInput) => {
			try {
				// Validate initiative exists
				await validateInitiativeForKnowledgeCollection(initiativeId);

				// Generate the prompt
				const promptText =
					await generateKnowledgeCollectionPrompt(initiativeId);

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
					`Failed to create knowledge collection prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
