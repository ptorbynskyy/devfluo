// ABOUTME: Prompt for completing initiatives with knowledge extraction and promotion to project knowledge base

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadInitiative } from "../domain/initiative/index.js";
import type { Task } from "../domain/initiative/task-schema.js";
import { loadTasks } from "../domain/initiative/tasks.js";
import {
	type InitiativeContext,
	loadInitiativeContext,
} from "../templates/utils/project-context.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";
import { renderTemplateFile } from "../utils/template-engine.js";
import {
	createCompletableInitiativeId,
	initiativeIdSchema,
} from "./shared/initiative-id.js";

// Zod schema for completion input validation
export const InitiativeCompletionInputSchema = z.object({
	initiativeId: initiativeIdSchema.describe("ID of the initiative to complete"),
	comments: z.string().optional().describe("Additional comments"),
});

export type InitiativeCompletionInput = z.infer<
	typeof InitiativeCompletionInputSchema
>;

// Validate that all tasks are completed
export function validateAllTasksCompleted(tasks: Task[]): void {
	const incompleteTasks = tasks.filter((task) => task.status !== "done");

	if (incompleteTasks.length > 0) {
		const taskList = incompleteTasks
			.map((task) => `- ${task.id}: ${task.name} (status: ${task.status})`)
			.join("\n");

		throw new McpError(
			ErrorCode.InvalidParams,
			`Cannot complete initiative: ${incompleteTasks.length} task(s) are not completed:\n${taskList}\n\nPlease mark all tasks as 'done' before completing the initiative.`,
		);
	}
}

export async function validateInitiativeForCompletion(initiativeId: string) {
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
			`Initiative '${initiativeId}' is already completed.`,
		);
	}

	// Load all tasks for validation
	const allTasks = await loadTasks(initiativeId);

	if (allTasks.length === 0) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' has no tasks. Cannot complete an initiative without any tasks.`,
		);
	}

	// Validate all tasks are completed
	validateAllTasksCompleted(allTasks);

	return { initiative, allTasks };
}

export async function generateInitiativeCompletionPrompt(
	context: InitiativeContext,
	comments?: string,
): Promise<string> {
	return await renderTemplateFile("initiative-completion.eta", {
		context,
		comments,
	});
}

export function setupInitiativeCompletionPrompt(server: McpServer): void {
	server.registerPrompt(
		"initiative_completion",
		{
			title: "complete-initiative",
			description:
				"Complete an initiative by extracting knowledge, promoting valuable items to project knowledge base, and marking initiative as complete",
			argsSchema: {
				initiativeId: createCompletableInitiativeId(
					"ID of the initiative to complete",
				),
				comments: z.string().optional().describe("Additional comments"),
			},
		},
		async ({ initiativeId, comments }: InitiativeCompletionInput) => {
			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				// Validate initiative and tasks
				const { initiative } =
					await validateInitiativeForCompletion(initiativeId);

				// Load full initiative context
				const context = await loadInitiativeContext(initiative);

				// Generate the prompt
				const promptText = await generateInitiativeCompletionPrompt(
					context,
					comments,
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
					`Failed to create initiative completion prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
