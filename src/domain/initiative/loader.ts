// ABOUTME: Loading functions for initiatives from file system

import { access, mkdir, readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";
import {
	getInitiativeOverviewPath,
	getInitiativeSpecPath,
	initiativePath,
} from "./paths.js";
import {
	type InitiativeWithOverview,
	parseInitiativeFromFile,
} from "./schema.js";

// Load basic initiative data (without overview content)
async function loadInitiativeBasic(
	id: string,
): Promise<InitiativeWithOverview | null> {
	try {
		const overviewPath = getInitiativeOverviewPath(id);
		const specPath = getInitiativeSpecPath(id);

		// Read overview.md only for front matter
		const overviewContent = await readFile(overviewPath, "utf-8");
		const validatedInitiative = parseInitiativeFromFile(id, overviewContent);

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
			hasOverview: true, // overview.md always exists now
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
		const overviewPath = getInitiativeOverviewPath(id);
		const specPath = getInitiativeSpecPath(id);

		// Read overview.md and parse front matter
		const overviewContent = await readFile(overviewPath, "utf-8");
		const { content } = matter(overviewContent);
		const validatedInitiative = parseInitiativeFromFile(id, overviewContent);

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
			overview: content.trim(), // Extract content from markdown body
			hasOverview: true, // overview.md always exists now
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
