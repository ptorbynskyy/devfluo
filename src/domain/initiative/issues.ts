// ABOUTME: CRUD operations for issues within initiatives

import {
	mkdir,
	readdir,
	readFile,
	rmdir,
	unlink,
	writeFile,
} from "node:fs/promises";
import {
	type Issue,
	type IssueOperations,
	IssueSchema,
} from "./issue-schema.js";
import {
	getInitiativeIssuesPath,
	getIssueDataPath,
	getIssueDirectoryPath,
} from "./paths.js";

// Load all issues for a specific initiative
export async function loadIssues(initiativeId: string): Promise<Issue[]> {
	try {
		const issuesPath = getInitiativeIssuesPath(initiativeId);
		const issueDirectories = await readdir(issuesPath);

		const issues: Issue[] = [];
		for (const issueId of issueDirectories) {
			const issueDataPath = getIssueDataPath(initiativeId, issueId);
			try {
				const data = await readFile(issueDataPath, "utf-8");
				const issue = JSON.parse(data);
				issues.push(IssueSchema.parse(issue));
			} catch (error) {
				// Skip invalid or missing issue files
				console.warn(`Skipping invalid issue file: ${issueDataPath}`, error);
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
		const issueDataPath = getIssueDataPath(initiativeId, issueId);
		const data = await readFile(issueDataPath, "utf-8");
		const issue = JSON.parse(data);
		return IssueSchema.parse(issue);
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
	const issueDirectoryPath = getIssueDirectoryPath(initiativeId, issue.id);
	const issueDataPath = getIssueDataPath(initiativeId, issue.id);

	// Validate issue before saving
	const validatedIssue = IssueSchema.parse(issue);

	// Ensure directories exist
	await mkdir(issueDirectoryPath, { recursive: true });

	// Write issue data
	await writeFile(issueDataPath, JSON.stringify(validatedIssue, null, "\t"));
}

// Delete an issue
export async function deleteIssue(
	initiativeId: string,
	issueId: string,
): Promise<void> {
	try {
		const issueDirectoryPath = getIssueDirectoryPath(initiativeId, issueId);
		const issueDataPath = getIssueDataPath(initiativeId, issueId);

		// Remove data file
		await unlink(issueDataPath);

		// Remove directory
		await rmdir(issueDirectoryPath);
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
		return await readdir(issuesPath);
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
