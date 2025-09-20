// ABOUTME: Zod schemas for validating task data structure within initiatives

import matter from "gray-matter";
import { z } from "zod";
import { EffortLevels } from "../backlog-schema.js";

// Task statuses
export const TaskStatuses = ["new", "done"] as const;

// Zod schema for validating task data structure
export const TaskSchema = z.object({
	id: z
		.string()
		.min(1)
		.regex(
			/^t\d+$/,
			"Task ID must start with 't' followed by numbers (e.g., t001, t123)",
		)
		.describe("Unique identifier for the task within initiative."),
	name: z.string().min(1).describe("Human readable name of the task."),
	description: z
		.string()
		.min(1)
		.describe(
			"Detailed description of what the task involves in markdown format",
		),
	effort: z
		.enum(EffortLevels)
		.optional()
		.describe("Effort estimation for the task. Options: S/M/L/XL/XXL"),
	status: z
		.enum(TaskStatuses)
		.default("new")
		.describe("Current status of the task. Options: new/done"),
	order: z
		.number()
		.int()
		.min(1)
		.describe(
			"Order number for sorting tasks within a phase. Lower numbers appear first.",
		),
	phase: z
		.number()
		.int()
		.min(1)
		.describe(
			"Phase number that groups tasks by development stage. Displayed as 'Phase X'",
		),
	predecessors: z
		.array(
			z
				.string()
				.regex(
					/^t\d+$/,
					"Predecessor task ID must start with 't' followed by numbers (e.g., t001, t123)",
				),
		)
		.describe(
			"Array of task IDs that must be completed before this task can start. Use empty array [] if no predecessors.",
		),
});

// Schema for task operations (create/update/delete)
export const TaskOperationsSchema = z.object({
	create: z
		.array(TaskSchema)
		.optional()
		.describe("Array of complete task objects to create."),
	update: z
		.record(z.string(), TaskSchema.omit({ id: true }).partial())
		.optional()
		.describe(
			"Object with task IDs as keys and partial task objects as values for updates.",
		),
	delete: z
		.array(z.string())
		.optional()
		.describe("Array of task IDs to delete."),
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskOperations = z.infer<typeof TaskOperationsSchema>;
export type TaskStatus = (typeof TaskStatuses)[number];

// Parse task from Markdown file content with front matter
export function parseTaskFromFile(taskId: string, fileContent: string): Task {
	const { data, content } = matter(fileContent);

	return TaskSchema.parse({
		id: taskId,
		name: data.name,
		description: content.trim(),
		effort: data.effort,
		status: data.status || "new",
		order: data.order,
		phase: data.phase,
		predecessors: data.predecessors || [],
	});
}

// Generate Markdown file content with front matter from task
export function taskToMarkdownContent(task: Task): string {
	const frontmatter = {
		name: task.name,
		effort: task.effort,
		status: task.status,
		order: task.order,
		phase: task.phase,
		predecessors: task.predecessors,
	};

	return matter.stringify(task.description, frontmatter);
}
