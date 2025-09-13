// ABOUTME: Prompt for creating task plans for initiatives with specifications

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { loadInitiative } from "../domain/initiative/index.js";
import { loadTasks } from "../domain/initiative/tasks.js";
import { renderTemplateFile } from "../utils/template-engine.js";
import { createCompletableInitiativeId } from "./shared/initiative-id.js";
import {
	loadProjectContext,
	type ProjectContext,
} from "./shared/project-context.js";

export async function validateInitiativeForPlanning(initiativeId: string) {
	const initiative = await loadInitiative(initiativeId);

	if (!initiative) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' does not exist. Please create it first using the initiative_create tool.`,
		);
	}

	if (!initiative.hasSpec) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' does not have a specification. Please create one first using the 'create-initiative-specification' prompt.`,
		);
	}

	const existingTasks = await loadTasks(initiativeId);
	if (existingTasks.length > 0) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' already has ${existingTasks.length} task(s). Task planning is only available for initiatives with empty task lists.`,
		);
	}

	return initiative;
}

export async function generateInitiativePlanningPrompt(
	initiative: {
		id: string;
		name: string;
		overview?: string | undefined;
		spec?: string | undefined;
	},
	context: ProjectContext,
): Promise<string> {
	return await renderTemplateFile("initiative-planning.eta", {
		initiative,
		context,
	});
}

export function setupInitiativePlanningPrompt(server: McpServer): void {
	server.registerPrompt(
		"initiative_planning",
		{
			title: "create-initiative-task-plan",
			description:
				"Generate structured task lists for initiatives that have specifications but no existing tasks",
			argsSchema: {
				initiativeId: createCompletableInitiativeId(
					"ID of the initiative to create tasks for",
				),
			},
		},
		async ({ initiativeId }: { initiativeId: string }) => {
			try {
				// Validate initiative exists, has spec, and no tasks
				const initiative = await validateInitiativeForPlanning(initiativeId);

				// Load all project context
				const context = await loadProjectContext();

				// Generate the prompt
				const promptText = await generateInitiativePlanningPrompt(
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
					`Failed to create initiative planning prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
