// ABOUTME: File system persistence operations for initiatives

import { mkdir, unlink, writeFile } from "node:fs/promises";
import {
	getInitiativeDataPath,
	getInitiativeOverviewPath,
	getInitiativePath,
	getInitiativeSpecPath,
} from "./paths.js";
import type { Initiative } from "./schema.js";

// Save an initiative to file system
export async function saveInitiative(
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
