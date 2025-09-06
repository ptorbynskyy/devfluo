// ABOUTME: Domain module for managing backlog items with CRUD operations and file-system storage

import {
	mkdir,
	readFile,
	writeFile,
	readdir,
	rmdir,
	access,
	unlink,
} from "node:fs/promises";
import path from "node:path";
import { baseKnowledgePath } from "./base-knowledge.js";
import {
	type BacklogItem,
	type BacklogItemWithSpec,
	type BacklogOperations,
	BacklogItemSchema,
} from "./backlog-schema.js";

export const backlogPath = path.join(baseKnowledgePath, "backlog");

// Helper function to get backlog item directory path
function getBacklogItemPath(id: string): string {
	return path.join(backlogPath, id);
}

// Helper function to get data.json path for an item
function getBacklogItemDataPath(id: string): string {
	return path.join(getBacklogItemPath(id), "data.json");
}

// Helper function to get spec.md path for an item
function getBacklogItemSpecPath(id: string): string {
	return path.join(getBacklogItemPath(id), "spec.md");
}

// Load basic backlog item data (without spec content)
async function loadBacklogItemBasic(id: string): Promise<BacklogItemWithSpec | null> {
	try {
		const dataPath = getBacklogItemDataPath(id);
		const specPath = getBacklogItemSpecPath(id);

		// Read data.json only
		const dataContent = await readFile(dataPath, "utf-8");
		const itemData = JSON.parse(dataContent);

		// Validate the data structure
		const validatedItem = BacklogItemSchema.parse({ id, ...itemData });

		// Check if spec.md exists without reading its content
		let hasSpec = false;
		try {
			await access(specPath);
			hasSpec = true;
		} catch {
			// spec.md doesn't exist
			hasSpec = false;
		}

		return {
			...validatedItem,
			spec: undefined, // Don't load spec content for performance
			hasSpec,
		};
	} catch (error) {
		console.error(`Error loading backlog item ${id}:`, error);
		return null;
	}
}

// Load all backlog items (without spec content)
export async function loadBacklogItems(): Promise<BacklogItemWithSpec[]> {
	try {
		await mkdir(backlogPath, { recursive: true });
		const itemDirs = await readdir(backlogPath, { withFileTypes: true });
		const items: BacklogItemWithSpec[] = [];

		for (const dir of itemDirs) {
			if (dir.isDirectory()) {
				const itemId = dir.name;
				// Use basic loader to avoid reading spec content for better performance
				const item = await loadBacklogItemBasic(itemId);
				if (item) {
					items.push(item);
				}
			}
		}

		return items;
	} catch {
		// Directory doesn't exist or is empty
		return [];
	}
}

// Load a single backlog item by ID (with spec content if exists)
export async function loadBacklogItem(
	id: string,
): Promise<BacklogItemWithSpec | null> {
	try {
		const dataPath = getBacklogItemDataPath(id);
		const specPath = getBacklogItemSpecPath(id);

		// Read data.json
		const dataContent = await readFile(dataPath, "utf-8");
		const itemData = JSON.parse(dataContent);

		// Validate the data structure
		const validatedItem = BacklogItemSchema.parse({ id, ...itemData });

		// Check if spec.md exists and read it
		let spec: string | undefined;
		let hasSpec = false;

		try {
			spec = await readFile(specPath, "utf-8");
			hasSpec = true;
		} catch {
			// spec.md doesn't exist
			spec = undefined;
			hasSpec = false;
		}

		return {
			...validatedItem,
			spec,
			hasSpec,
		};
	} catch (error) {
		console.error(`Error loading backlog item ${id}:`, error);
		return null;
	}
}

// Get list of all backlog item IDs (for completion)
export async function getBacklogItemIds(): Promise<string[]> {
	try {
		await mkdir(backlogPath, { recursive: true });
		const itemDirs = await readdir(backlogPath, { withFileTypes: true });
		return itemDirs
			.filter((dir) => dir.isDirectory())
			.map((dir) => dir.name)
			.sort();
	} catch {
		return [];
	}
}

// Save a backlog item to file system
async function saveBacklogItem(
	item: BacklogItem,
	spec?: string,
): Promise<void> {
	const itemPath = getBacklogItemPath(item.id);
	const dataPath = getBacklogItemDataPath(item.id);
	const specPath = getBacklogItemSpecPath(item.id);

	// Create item directory
	await mkdir(itemPath, { recursive: true });

	// Save data.json (without the id field since it's in the folder name)
	const { id: _, ...dataToSave } = item;
	await writeFile(dataPath, JSON.stringify(dataToSave, null, 2), "utf-8");

	// Save spec.md if provided
	if (spec !== undefined) {
		if (spec.trim() === "") {
			// Remove spec file if empty string is provided
			try {
				await unlink(specPath);
			} catch {
				// File doesn't exist, nothing to do
			}
		} else {
			await writeFile(specPath, spec, "utf-8");
		}
	}
}

// Delete a backlog item from file system
async function deleteBacklogItem(id: string): Promise<boolean> {
	try {
		const itemPath = getBacklogItemPath(id);
		const dataPath = getBacklogItemDataPath(id);
		const specPath = getBacklogItemSpecPath(id);

		// Remove files if they exist
		try {
			await unlink(dataPath);
		} catch {
			// data.json doesn't exist
		}

		try {
			await unlink(specPath);
		} catch {
			// spec.md doesn't exist
		}

		// Remove directory if it exists
		try {
			await rmdir(itemPath);
		} catch {
			// Directory doesn't exist or not empty
		}

		return true;
	} catch {
		return false;
	}
}

export async function processBacklogOperations(
	operations: BacklogOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	// Ensure backlog directory exists before any file operations
	await mkdir(backlogPath, { recursive: true });

	let updateCount = 0;
	let insertCount = 0;
	let deleteCount = 0;

	// Process creates - new backlog items with complete data
	if (operations.create) {
		for (const newItem of operations.create) {
			const validatedItem = BacklogItemSchema.parse(newItem);
			const existingItem = await loadBacklogItem(validatedItem.id);

			if (existingItem) {
				// Item already exists, treat as update
				await saveBacklogItem(validatedItem, newItem.spec);
				updateCount++;
			} else {
				// Create new item
				await saveBacklogItem(validatedItem, newItem.spec);
				insertCount++;
			}
		}
	}

	// Process updates - partial updates to existing items
	if (operations.update) {
		for (const [itemId, updates] of Object.entries(operations.update)) {
			const existingItem = await loadBacklogItem(itemId);
			if (existingItem) {
				// Update existing item with merged properties
				const updatedItem: BacklogItem = {
					id: itemId,
					name: updates.name ?? existingItem.name,
					description: updates.description ?? existingItem.description,
					effort: updates.effort ?? existingItem.effort,
				};

				// Validate the updated item
				const validatedItem = BacklogItemSchema.parse(updatedItem);
				await saveBacklogItem(validatedItem, updates.spec);
				updateCount++;
			} else {
				throw new Error(
					`Backlog item '${itemId}' does not exist. Please create it first.`,
				);
			}
		}
	}

	// Process deletions
	if (operations.delete) {
		for (const itemId of operations.delete) {
			const deleted = await deleteBacklogItem(itemId);
			if (deleted) {
				deleteCount++;
			}
		}
	}

	return {
		updateCount,
		insertCount,
		deleteCount,
	};
}
