// ABOUTME: Loading functions for initiatives from file system

import { access, mkdir, readdir, readFile } from "node:fs/promises";
import {
	getInitiativeDataPath,
	getInitiativeOverviewPath,
	getInitiativeSpecPath,
	initiativePath,
} from "./paths.js";
import { InitiativeSchema, type InitiativeWithOverview } from "./schema.js";

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
