// ABOUTME: Prompt for creating comprehensive specifications for initiatives

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { loadInitiative } from "../domain/initiative/index.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";
import { renderTemplateFile } from "../utils/template-engine.js";
import { createCompletableInitiativeId } from "./shared/initiative-id.js";
import {
	loadProjectContext,
	type ProjectContext,
} from "./shared/project-context.js";

export async function validateInitiativeForSpec(initiativeId: string) {
	const initiative = await loadInitiative(initiativeId);

	if (!initiative) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' does not exist. Please create it first using the initiative_create tool.`,
		);
	}

	if (initiative.hasSpec) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' already has a specification. Use the initiative_update tool to update it if needed.`,
		);
	}

	return initiative;
}

export async function generateInitiativeSpecificationPrompt(
	initiative: {
		id: string;
		name: string;
		overview?: string | undefined;
	},
	context: ProjectContext,
): Promise<string> {
	return await renderTemplateFile("initiative-specification.eta", {
		initiative,
		context,
	});
}

export function setupInitiativeSpecificationPrompt(server: McpServer): void {
	server.registerPrompt(
		"initiative_specification",
		{
			title: "create-initiative-specification",
			description:
				"Generate a comprehensive specification for an initiative through guided brainstorming",
			argsSchema: {
				initiativeId: createCompletableInitiativeId(
					"ID of the initiative to create a specification for",
				),
			},
		},
		async ({ initiativeId }: { initiativeId: string }) => {
			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				// Validate initiative exists and doesn't already have a spec
				const initiative = await validateInitiativeForSpec(initiativeId);

				// Load all project context
				const context = await loadProjectContext();

				// Generate the prompt
				const promptText = await generateInitiativeSpecificationPrompt(
					initiative,
					context,
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
					`Failed to create initiative specification prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
