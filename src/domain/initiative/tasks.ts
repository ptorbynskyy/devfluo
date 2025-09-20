// ABOUTME: CRUD operations for tasks within initiatives

import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getInitiativeTasksPath, getTaskFilePath } from "./paths.js";
import {
	parseTaskFromFile,
	type Task,
	type TaskOperations,
	TaskSchema,
	taskToMarkdownContent,
} from "./task-schema.js"; // Validate that all predecessor task IDs exist in the task list

// Validate that all predecessor task IDs exist in the task list
function validatePredecessors(
	tasks: Task[],
	predecessors: string[],
	currentTaskId?: string,
): void {
	const existingTaskIds = new Set(tasks.map((task) => task.id));

	for (const predecessorId of predecessors) {
		if (!existingTaskIds.has(predecessorId)) {
			throw new Error(`Predecessor task '${predecessorId}' does not exist`);
		}
		if (currentTaskId && predecessorId === currentTaskId) {
			throw new Error(
				`Task '${currentTaskId}' cannot be a predecessor of itself`,
			);
		}
	}
}

// Check for circular dependencies in the task graph
function detectCircularDependencies(tasks: Task[]): void {
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function hasCycle(taskId: string): boolean {
		if (recursionStack.has(taskId)) {
			return true;
		}
		if (visited.has(taskId)) {
			return false;
		}

		visited.add(taskId);
		recursionStack.add(taskId);

		const task = tasks.find((t) => t.id === taskId);
		if (task) {
			for (const predecessor of task.predecessors) {
				if (hasCycle(predecessor)) {
					return true;
				}
			}
		}

		recursionStack.delete(taskId);
		return false;
	}

	for (const task of tasks) {
		if (hasCycle(task.id)) {
			throw new Error("Circular dependency detected in task predecessors");
		}
	}
}

// Load all tasks for a specific initiative
export async function loadTasks(initiativeId: string): Promise<Task[]> {
	const tasksDir = getInitiativeTasksPath(initiativeId);

	try {
		const files = await readdir(tasksDir);
		const tasks: Task[] = [];

		for (const file of files) {
			if (file.endsWith(".md")) {
				const taskId = path.basename(file, ".md");
				const filePath = path.join(tasksDir, file);

				try {
					const fileContent = await readFile(filePath, "utf-8");
					const task = parseTaskFromFile(taskId, fileContent);
					tasks.push(task);
				} catch (error) {
					console.error(`Error parsing task file ${file}:`, error);
					// Skip invalid files
				}
			}
		}

		return tasks;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			// Directory doesn't exist, return empty array
			return [];
		}
		throw error;
	}
}

// Delete individual task file
async function deleteTaskFile(
	initiativeId: string,
	taskId: string,
): Promise<void> {
	try {
		const filePath = getTaskFilePath(initiativeId, taskId);
		await unlink(filePath);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			// File doesn't exist, nothing to delete
			return;
		}
		throw error;
	}
}

// Delete all tasks for an initiative
export async function deleteTasks(initiativeId: string): Promise<void> {
	try {
		const tasksDir = getInitiativeTasksPath(initiativeId);
		const files = await readdir(tasksDir);

		// Delete all task files
		for (const file of files) {
			if (file.endsWith(".md")) {
				await unlink(path.join(tasksDir, file));
			}
		}

		// Remove the directory if it's empty
		try {
			const remainingFiles = await readdir(tasksDir);
			if (remainingFiles.length === 0) {
				await unlink(tasksDir);
			}
		} catch {
			// Directory might not be empty or other error, ignore
		}
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			// Directory doesn't exist, nothing to delete
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
	// Load existing tasks for validation
	const existingTasks = await loadTasks(initiativeId);
	let insertCount = 0;
	let updateCount = 0;
	let deleteCount = 0;

	// Process deletes first to avoid dependency validation issues
	if (operations.delete && operations.delete.length > 0) {
		for (const taskId of operations.delete) {
			const taskIndex = existingTasks.findIndex((task) => task.id === taskId);
			if (taskIndex < 0) {
				throw new Error(`Task with ID '${taskId}' does not exist`);
			}

			// Check if any other tasks depend on this task
			const dependentTasks = existingTasks.filter((task) =>
				task.predecessors.includes(taskId),
			);
			if (dependentTasks.length > 0) {
				const dependentIds = dependentTasks.map((task) => task.id).join(", ");
				throw new Error(
					`Cannot delete task '${taskId}' because it is a predecessor for tasks: ${dependentIds}`,
				);
			}

			// Delete the task file
			await deleteTaskFile(initiativeId, taskId);
			existingTasks.splice(taskIndex, 1);
			deleteCount++;
		}
	}

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

			// Validate predecessors exist
			validatePredecessors(
				existingTasks,
				validatedTask.predecessors,
				validatedTask.id,
			);

			// Write the task file
			const tasksDir = getInitiativeTasksPath(initiativeId);
			await mkdir(tasksDir, { recursive: true });
			const filePath = getTaskFilePath(initiativeId, validatedTask.id);
			const content = taskToMarkdownContent(validatedTask);
			await writeFile(filePath, content, "utf-8");

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
			const validatedTask = TaskSchema.parse(updatedTask);

			// If predecessors are being updated, validate them
			if (updates.predecessors !== undefined) {
				validatePredecessors(existingTasks, validatedTask.predecessors, taskId);
			}

			// Write the updated task file
			const filePath = getTaskFilePath(initiativeId, taskId);
			const content = taskToMarkdownContent(validatedTask);
			await writeFile(filePath, content, "utf-8");

			existingTasks[taskIndex] = validatedTask;
			updateCount++;
		}
	}

	// Final validation: check for circular dependencies if any operations were performed
	if (insertCount > 0 || updateCount > 0 || deleteCount > 0) {
		if (existingTasks.length === 0) {
			// If no tasks left, clean up the directory
			await deleteTasks(initiativeId);
		} else {
			// Check for circular dependencies
			detectCircularDependencies(existingTasks);
		}
	}

	return { insertCount, updateCount, deleteCount };
}
