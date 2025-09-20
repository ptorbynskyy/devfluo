// ABOUTME: CRUD operations for issues within initiatives

import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	type Issue,
	type IssueOperations,
	IssueSchema,
	issueToMarkdownContent,
	parseIssueFromFile,
} from "./issue-schema.js";
import { getInitiativeIssuesPath, getIssueFilePath } from "./paths.js";

// Load all issues for a specific initiative
export async function loadIssues(initiativeId: string): Promise<Issue[]> {
	try {
		const issuesPath = getInitiativeIssuesPath(initiativeId);
		const files = await readdir(issuesPath);

		const issues: Issue[] = [];
		for (const file of files) {
			if (file.endsWith(".md")) {
				const issueId = path.basename(file, ".md");
				const filePath = path.join(issuesPath, file);

				try {
					const fileContent = await readFile(filePath, "utf-8");
					const issue = parseIssueFromFile(issueId, fileContent);
					issues.push(issue);
				} catch (error) {
					// Skip invalid or missing issue files
					console.warn(`Skipping invalid issue file: ${filePath}`, error);
				}
			}
		}

		return issues;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			// issues directory doesn't exist, return empty array
			return [];
		}
		throw error;
	}
}

// Load a specific issue
export async function loadIssue(
	initiativeId: string,
	issueId: string,
): Promise<Issue | null> {
	try {
		const issueFilePath = getIssueFilePath(initiativeId, issueId);
		const fileContent = await readFile(issueFilePath, "utf-8");
		return parseIssueFromFile(issueId, fileContent);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

// Save an issue to file
export async function saveIssue(
	initiativeId: string,
	issue: Issue,
): Promise<void> {
	const issueFilePath = getIssueFilePath(initiativeId, issue.id);

	// Validate issue before saving
	const validatedIssue = IssueSchema.parse(issue);

	// Ensure issues directory exists
	const issuesDir = getInitiativeIssuesPath(initiativeId);
	await mkdir(issuesDir, { recursive: true });

	// Write issue data as Markdown with Front Matter
	const content = issueToMarkdownContent(validatedIssue);
	await writeFile(issueFilePath, content, "utf-8");
}

// Delete an issue
export async function deleteIssue(
	initiativeId: string,
	issueId: string,
): Promise<void> {
	try {
		const issueFilePath = getIssueFilePath(initiativeId, issueId);

		// Remove issue file
		await unlink(issueFilePath);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			// Issue doesn't exist, nothing to delete
			return;
		}
		throw error;
	}
}

// Get list of issue IDs for an initiative
export async function getIssueIds(initiativeId: string): Promise<string[]> {
	try {
		const issuesPath = getInitiativeIssuesPath(initiativeId);
		const files = await readdir(issuesPath);
		return files
			.filter((file) => file.endsWith(".md"))
			.map((file) => path.basename(file, ".md"));
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return [];
		}
		throw error;
	}
}

// Process issue operations (create, update, delete)
export async function processIssueOperations(
	initiativeId: string,
	operations: IssueOperations,
): Promise<{ insertCount: number; updateCount: number; deleteCount: number }> {
	let insertCount = 0;
	let updateCount = 0;
	let deleteCount = 0;

	// Process creates
	if (operations.create && operations.create.length > 0) {
		for (const newIssue of operations.create) {
			// Check if issue already exists
			const existingIssue = await loadIssue(initiativeId, newIssue.id);
			if (existingIssue) {
				throw new Error(`Issue with ID '${newIssue.id}' already exists`);
			}

			// Validate and save new issue
			await saveIssue(initiativeId, newIssue);
			insertCount++;
		}
	}

	// Process updates
	if (operations.update) {
		for (const [issueId, updates] of Object.entries(operations.update)) {
			const existingIssue = await loadIssue(initiativeId, issueId);
			if (!existingIssue) {
				throw new Error(`Issue with ID '${issueId}' does not exist`);
			}

			// Merge updates with existing issue
			const updatedIssue = { ...existingIssue, ...updates };

			// Validate and save updated issue
			const validatedIssue = IssueSchema.parse(updatedIssue);
			await saveIssue(initiativeId, validatedIssue);
			updateCount++;
		}
	}

	// Process deletes
	if (operations.delete && operations.delete.length > 0) {
		for (const issueId of operations.delete) {
			const existingIssue = await loadIssue(initiativeId, issueId);
			if (!existingIssue) {
				throw new Error(`Issue with ID '${issueId}' does not exist`);
			}

			await deleteIssue(initiativeId, issueId);
			deleteCount++;
		}
	}

	return { insertCount, updateCount, deleteCount };
}
