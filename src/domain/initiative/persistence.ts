// ABOUTME: File system persistence operations for initiatives

import { mkdir, unlink, writeFile } from "node:fs/promises";
import {
	getInitiativeOverviewPath,
	getInitiativePath,
	getInitiativeSpecPath,
} from "./paths.js";
import { type Initiative, initiativeToMarkdownContent } from "./schema.js";

// Save an initiative to file system
export async function saveInitiative(
	initiative: Initiative,
	overview?: string,
	spec?: string | null,
): Promise<void> {
	const itemPath = getInitiativePath(initiative.id);
	const overviewPath = getInitiativeOverviewPath(initiative.id);
	const specPath = getInitiativeSpecPath(initiative.id);

	// Create initiative directory
	await mkdir(itemPath, { recursive: true });

	// Always create overview.md with front matter containing initiative metadata
	const overviewContent = initiativeToMarkdownContent(
		initiative,
		overview || "",
	);
	await writeFile(overviewPath, overviewContent, "utf-8");

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
