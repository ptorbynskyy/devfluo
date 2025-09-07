// ABOUTME: CRUD operations for tasks within initiatives

import { readFile, unlink, writeFile } from "node:fs/promises";
import { getInitiativeTasksPath } from "./paths.js";
import { type Task, type TaskOperations, TaskSchema } from "./task-schema.js";

// Load all tasks for a specific initiative
export async function loadTasks(initiativeId: string): Promise<Task[]> {
	try {
		const tasksPath = getInitiativeTasksPath(initiativeId);
		const data = await readFile(tasksPath, "utf-8");
		const tasks = JSON.parse(data);

		// Validate each task
		return tasks.map((task: unknown) => TaskSchema.parse(task));
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			// tasks.json doesn't exist, return empty array
			return [];
		}
		throw error;
	}
}

// Save tasks to file
export async function saveTasks(
	initiativeId: string,
	tasks: Task[],
): Promise<void> {
	const tasksPath = getInitiativeTasksPath(initiativeId);

	// Validate all tasks before saving
	const validatedTasks = tasks.map((task) => TaskSchema.parse(task));

	// Sort tasks by phase, then by order
	const sortedTasks = validatedTasks.sort((a, b) => {
		if (a.phase !== b.phase) {
			return a.phase - b.phase;
		}
		return a.order - b.order;
	});

	await writeFile(tasksPath, JSON.stringify(sortedTasks, null, "\t"));
}

// Delete tasks file for an initiative
export async function deleteTasks(initiativeId: string): Promise<void> {
	try {
		const tasksPath = getInitiativeTasksPath(initiativeId);
		await unlink(tasksPath);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			// tasks.json doesn't exist, nothing to delete
			return;
		}
		throw error;
	}
}

// Process task operations (create, update, delete)
export async function processTaskOperations(
	initiativeId: string,
	operations: TaskOperations,
): Promise<{ insertCount: number; updateCount: number; deleteCount: number }> {
	// Load existing tasks
	const existingTasks = await loadTasks(initiativeId);
	let insertCount = 0;
	let updateCount = 0;
	let deleteCount = 0;

	// Process creates
	if (operations.create && operations.create.length > 0) {
		for (const newTask of operations.create) {
			// Check if task already exists
			const existingIndex = existingTasks.findIndex(
				(task) => task.id === newTask.id,
			);
			if (existingIndex >= 0) {
				throw new Error(`Task with ID '${newTask.id}' already exists`);
			}

			// Validate and add new task
			const validatedTask = TaskSchema.parse(newTask);
			existingTasks.push(validatedTask);
			insertCount++;
		}
	}

	// Process updates
	if (operations.update) {
		for (const [taskId, updates] of Object.entries(operations.update)) {
			const taskIndex = existingTasks.findIndex((task) => task.id === taskId);
			if (taskIndex < 0) {
				throw new Error(`Task with ID '${taskId}' does not exist`);
			}

			// Merge updates with existing task
			const updatedTask = { ...existingTasks[taskIndex], ...updates };

			// Validate updated task
			existingTasks[taskIndex] = TaskSchema.parse(updatedTask);
			updateCount++;
		}
	}

	// Process deletes
	if (operations.delete && operations.delete.length > 0) {
		for (const taskId of operations.delete) {
			const taskIndex = existingTasks.findIndex((task) => task.id === taskId);
			if (taskIndex < 0) {
				throw new Error(`Task with ID '${taskId}' does not exist`);
			}

			existingTasks.splice(taskIndex, 1);
			deleteCount++;
		}
	}

	// Save updated tasks
	if (insertCount > 0 || updateCount > 0 || deleteCount > 0) {
		if (existingTasks.length === 0) {
			// If no tasks left, delete the file
			await deleteTasks(initiativeId);
		} else {
			await saveTasks(initiativeId, existingTasks);
		}
	}

	return { insertCount, updateCount, deleteCount };
}
