// ABOUTME: Domain module for managing initiatives with CRUD operations and file-system storage

import {
	access,
	mkdir,
	readdir,
	readFile,
	rmdir,
	unlink,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import { deleteBacklogItem, loadBacklogItem } from "./backlog.js";
import { baseKnowledgePath } from "./base-knowledge.js";
import {
	type Initiative,
	type InitiativeCreateInput,
	InitiativeSchema,
	type InitiativeUpdateInput,
	type InitiativeWithOverview,
} from "./initiative-schema.js";

export const initiativePath = path.join(baseKnowledgePath, "initiatives");

// Helper function to get initiative directory path
function getInitiativePath(id: string): string {
	return path.join(initiativePath, id);
}

// Helper function to get data.json path for an initiative
function getInitiativeDataPath(id: string): string {
	return path.join(getInitiativePath(id), "data.json");
}

// Helper function to get overview.md path for an initiative
function getInitiativeOverviewPath(id: string): string {
	return path.join(getInitiativePath(id), "overview.md");
}

// Helper function to get spec.md path for an initiative
function getInitiativeSpecPath(id: string): string {
	return path.join(getInitiativePath(id), "spec.md");
}

// Load basic initiative data (without overview content)
async function loadInitiativeBasic(
	id: string,
): Promise<InitiativeWithOverview | null> {
	try {
		const dataPath = getInitiativeDataPath(id);
		const overviewPath = getInitiativeOverviewPath(id);
		const specPath = getInitiativeSpecPath(id);

		// Read data.json only
		const dataContent = await readFile(dataPath, "utf-8");
		const initiativeData = JSON.parse(dataContent);

		// Validate the data structure
		const validatedInitiative = InitiativeSchema.parse({
			id,
			...initiativeData,
		});

		// Check if overview.md exists without reading its content
		let hasOverview = false;
		try {
			await access(overviewPath);
			hasOverview = true;
		} catch {
			// overview.md doesn't exist
			hasOverview = false;
		}

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
			...validatedInitiative,
			overview: undefined, // Don't load overview content for performance
			hasOverview,
			spec: undefined, // Don't load spec content for performance
			hasSpec,
		};
	} catch (error) {
		console.error(`Error loading initiative ${id}:`, error);
		return null;
	}
}

// Load all initiatives (without overview content)
export async function loadInitiatives(): Promise<InitiativeWithOverview[]> {
	try {
		await mkdir(initiativePath, { recursive: true });
		const initiativeDirs = await readdir(initiativePath, {
			withFileTypes: true,
		});
		const initiatives: InitiativeWithOverview[] = [];

		for (const dir of initiativeDirs) {
			if (dir.isDirectory()) {
				const initiativeId = dir.name;
				// Use basic loader to avoid reading overview content for better performance
				const initiative = await loadInitiativeBasic(initiativeId);
				if (initiative) {
					initiatives.push(initiative);
				}
			}
		}

		return initiatives;
	} catch {
		// Directory doesn't exist or is empty
		return [];
	}
}

// Load a single initiative by ID (with overview content if exists)
export async function loadInitiative(
	id: string,
): Promise<InitiativeWithOverview | null> {
	try {
		const dataPath = getInitiativeDataPath(id);
		const overviewPath = getInitiativeOverviewPath(id);
		const specPath = getInitiativeSpecPath(id);

		// Read data.json
		const dataContent = await readFile(dataPath, "utf-8");
		const initiativeData = JSON.parse(dataContent);

		// Validate the data structure
		const validatedInitiative = InitiativeSchema.parse({
			id,
			...initiativeData,
		});

		// Check if overview.md exists and read it
		let overview: string | undefined;
		let hasOverview = false;

		try {
			overview = await readFile(overviewPath, "utf-8");
			hasOverview = true;
		} catch {
			// overview.md doesn't exist
			overview = undefined;
			hasOverview = false;
		}

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
			...validatedInitiative,
			overview,
			hasOverview,
			spec,
			hasSpec,
		};
	} catch (error) {
		console.error(`Error loading initiative ${id}:`, error);
		return null;
	}
}

// Get list of all initiative IDs (for completion)
export async function getInitiativeIds(): Promise<string[]> {
	try {
		await mkdir(initiativePath, { recursive: true });
		const initiativeDirs = await readdir(initiativePath, {
			withFileTypes: true,
		});
		return initiativeDirs
			.filter((dir) => dir.isDirectory())
			.map((dir) => dir.name)
			.sort();
	} catch {
		return [];
	}
}

// Save an initiative to file system
async function saveInitiative(
	initiative: Initiative,
	overview?: string,
	spec?: string | null,
): Promise<void> {
	const itemPath = getInitiativePath(initiative.id);
	const dataPath = getInitiativeDataPath(initiative.id);
	const overviewPath = getInitiativeOverviewPath(initiative.id);
	const specPath = getInitiativeSpecPath(initiative.id);

	// Create initiative directory
	await mkdir(itemPath, { recursive: true });

	// Save data.json (without the id field since it's in the folder name)
	const { id: _, ...dataToSave } = initiative;
	await writeFile(dataPath, JSON.stringify(dataToSave, null, 2), "utf-8");

	// Save overview.md if provided
	if (overview !== undefined) {
		if (overview.trim() === "") {
			// Remove overview file if empty string is provided
			try {
				await unlink(overviewPath);
			} catch {
				// File doesn't exist, nothing to do
			}
		} else {
			await writeFile(overviewPath, overview, "utf-8");
		}
	}

	// Save spec.md if provided
	if (spec !== undefined) {
		if (spec === null || spec.trim() === "") {
			// Remove spec file if null or empty string is provided
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
