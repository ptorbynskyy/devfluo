// ABOUTME: Prompt for executing specific tasks within an initiative with context and validation

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	generateTasksMarkdownReport,
	loadInitiative,
} from "../domain/initiative/index.js";
import type { Task } from "../domain/initiative/task-schema.js";
import { loadTasks } from "../domain/initiative/tasks.js";
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

// Zod schema for task input validation
export const TaskExecutionInputSchema = z.object({
	initiativeId: initiativeIdSchema.describe(
		"ID of the initiative containing tasks to execute",
	),
	taskRange: z
		.string()
		.min(1)
		.describe(
			"Task specification: single task (t001), comma-separated (t001,t002), or range (t003-t005)",
		),
});

export type TaskExecutionInput = z.infer<typeof TaskExecutionInputSchema>;

// Parse task range input into task IDs
export function parseTaskRange(taskRange: string): string[] {
	const trimmed = taskRange.trim();

	// Single task: t001
	if (/^t\d+$/.test(trimmed)) {
		return [trimmed];
	}

	// Comma-separated: t001,t002,t003
	if (trimmed.includes(",")) {
		const taskIds = trimmed.split(",").map((id) => id.trim());
		for (const taskId of taskIds) {
			if (!/^t\d+$/.test(taskId)) {
				throw new Error(
					`Invalid task ID '${taskId}'. Task IDs must be in format t001, t002, etc.`,
				);
			}
		}
		return taskIds;
	}

	// Range: t003-t005
	const rangeMatch = trimmed.match(/^(t\d+)-(t\d+)$/);
	if (rangeMatch?.[1] && rangeMatch[2]) {
		const startTask = rangeMatch[1];
		const endTask = rangeMatch[2];
		const startNum = Number.parseInt(startTask.substring(1), 10);
		const endNum = Number.parseInt(endTask.substring(1), 10);

		if (startNum > endNum) {
			throw new Error(
				`Invalid task range '${taskRange}'. Start task number must be less than or equal to end task number.`,
			);
		}

		const taskIds: string[] = [];
		for (let i = startNum; i <= endNum; i++) {
			taskIds.push(`t${i.toString().padStart(3, "0")}`);
		}
		return taskIds;
	}

	throw new Error(
		`Invalid task range format '${taskRange}'. Expected formats: t001, t001,t002, or t003-t005`,
	);
}

// Validate that tasks exist and are not completed
export function validateTasksExistAndExecutable(
	taskIds: string[],
	allTasks: Task[],
): Task[] {
	const taskMap = new Map(allTasks.map((task) => [task.id, task]));
	const selectedTasks: Task[] = [];

	for (const taskId of taskIds) {
		const task = taskMap.get(taskId);
		if (!task) {
			throw new Error(`Task '${taskId}' does not exist in this initiative.`);
		}

		if (task.status === "done") {
			throw new Error(
				`Task '${taskId}' is already completed. Only tasks with status 'new' can be executed.`,
			);
		}

		selectedTasks.push(task);
	}

	return selectedTasks;
}

// Check for blocking predecessors outside the selected task range
export function validateNonBlockingPredecessors(
	selectedTasks: Task[],
	allTasks: Task[],
): void {
	const selectedTaskIds = new Set(selectedTasks.map((task) => task.id));
	const taskMap = new Map(allTasks.map((task) => [task.id, task]));

	for (const task of selectedTasks) {
		const externalPredecessors = task.predecessors.filter(
			(predId) => !selectedTaskIds.has(predId),
		);

		for (const predId of externalPredecessors) {
			const predecessor = taskMap.get(predId);
			if (!predecessor) {
				throw new Error(
					`Task '${task.id}' depends on non-existent task '${predId}'.`,
				);
			}

			if (predecessor.status !== "done") {
				throw new Error(
					`Task '${task.id}' cannot be executed because its prerequisite '${predId}' is not completed.`,
				);
			}
		}
	}
}

export async function validateInitiativeForTaskExecution(
	initiativeId: string,
	taskRange: string,
) {
	const initiative = await loadInitiative(initiativeId);

	if (!initiative) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' does not exist. Please create it first using the initiative_create tool.`,
		);
	}

	// Load all tasks for validation
	const allTasks = await loadTasks(initiativeId);

	if (allTasks.length === 0) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Initiative '${initiativeId}' has no tasks. Create tasks first using the 'create-initiative-task-plan' prompt.`,
		);
	}

	// Parse and validate task range
	const taskIds = parseTaskRange(taskRange);
	const selectedTasks = validateTasksExistAndExecutable(taskIds, allTasks);
	validateNonBlockingPredecessors(selectedTasks, allTasks);

	return { initiative, selectedTasks, allTasks };
}

export async function generateTaskExecutionPrompt(
	context: InitiativeContext,
	selectedTasks: Task[],
): Promise<string> {
	return await renderTemplateFile("initiative-task-execution.eta", {
		context,
		selectedTasks,
		generateTasksMarkdownReport,
	});
}

export function setupInitiativeTaskExecutionPrompt(server: McpServer): void {
	server.registerPrompt(
		"initiative_task_execution",
		{
			title: "execute-initiative-tasks",
			description:
				"Execute specific tasks within an initiative with full context and knowledge tracking",
			argsSchema: {
				initiativeId: createCompletableInitiativeId(
					"ID of the initiative containing tasks to execute",
				),
				taskRange: TaskExecutionInputSchema.shape.taskRange,
			},
		},
		async ({ initiativeId, taskRange }: TaskExecutionInput) => {
			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				// Validate initiative and tasks
				const { initiative, selectedTasks } =
					await validateInitiativeForTaskExecution(initiativeId, taskRange);

				// Load full initiative context
				const context = await loadInitiativeContext(initiative);

				// Generate the prompt
				const promptText = await generateTaskExecutionPrompt(
					context,
					selectedTasks,
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
					`Failed to create task execution prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
