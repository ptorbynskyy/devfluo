// ABOUTME: CRUD operations for initiatives - create, update, delete

import { mkdir, rmdir, unlink } from "node:fs/promises";
import { deleteBacklogItem, loadBacklogItem } from "../backlog.js";
import { loadInitiative } from "./loader.js";
import {
	getInitiativeDataPath,
	getInitiativeOverviewPath,
	getInitiativePath,
	getInitiativeSpecPath,
	initiativePath,
} from "./paths.js";
import { saveInitiative } from "./persistence.js";
import {
	type Initiative,
	type InitiativeCreateInput,
	InitiativeSchema,
	type InitiativeUpdateInput,
} from "./schema.js";

// Create a new initiative
export async function createInitiative(
	input: InitiativeCreateInput,
): Promise<void> {
	// Ensure initiatives directory exists before any file operations
	await mkdir(initiativePath, { recursive: true });

	// Check if initiative already exists
	const existingInitiative = await loadInitiative(input.id);
	if (existingInitiative) {
		throw new Error(`Initiative '${input.id}' already exists`);
	}

	// Create new initiative with "new" state
	const newInitiative: Initiative = {
		id: input.id,
		name: input.name,
		state: "new",
	};

	// Handle creation from backlog if specified
	let specFromBacklog: string | undefined;
	if (input.fromBacklogId) {
		const backlogItem = await loadBacklogItem(input.fromBacklogId);
		if (!backlogItem) {
			throw new Error(`Backlog item '${input.fromBacklogId}' does not exist`);
		}
		// Copy spec from backlog if it exists
		specFromBacklog = backlogItem.spec;
	}

	// Validate the initiative data
	const validatedInitiative = InitiativeSchema.parse(newInitiative);
	await saveInitiative(validatedInitiative, input.overview, specFromBacklog);

	// Delete backlog item after successful initiative creation
	if (input.fromBacklogId) {
		await deleteBacklogItem(input.fromBacklogId);
	}
}

// Update an existing initiative
export async function updateInitiative(
	input: InitiativeUpdateInput,
): Promise<void> {
	// Load existing initiative
	const existingInitiative = await loadInitiative(input.id);
	if (!existingInitiative) {
		throw new Error(`Initiative '${input.id}' does not exist`);
	}

	// Update initiative with merged properties
	const updatedInitiative: Initiative = {
		id: input.id,
		name: input.name ?? existingInitiative.name,
		state: input.state ?? existingInitiative.state,
	};

	// Validate the updated initiative
	const validatedInitiative = InitiativeSchema.parse(updatedInitiative);
	await saveInitiative(validatedInitiative, input.overview, input.spec);
}

// Delete an initiative from file system
export async function deleteInitiative(id: string): Promise<void> {
	// Check if initiative exists
	const existingInitiative = await loadInitiative(id);
	if (!existingInitiative) {
		throw new Error(`Initiative '${id}' does not exist`);
	}

	const itemPath = getInitiativePath(id);
	const dataPath = getInitiativeDataPath(id);
	const overviewPath = getInitiativeOverviewPath(id);
	const specPath = getInitiativeSpecPath(id);

	// Remove files if they exist
	try {
		await unlink(dataPath);
	} catch {
		// data.json doesn't exist
	}

	try {
		await unlink(overviewPath);
	} catch {
		// overview.md doesn't exist
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
}
