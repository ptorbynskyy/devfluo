// ABOUTME: Path utility functions for initiative file system operations

import path from "node:path";
import { baseKnowledgePath } from "../base-knowledge.js";

export const initiativePath = path.join(baseKnowledgePath, "initiatives");

// Helper function to get initiative directory path
export function getInitiativePath(id: string): string {
	return path.join(initiativePath, id);
}

// Helper function to get data.json path for an initiative
export function getInitiativeDataPath(id: string): string {
	return path.join(getInitiativePath(id), "data.json");
}

// Helper function to get overview.md path for an initiative
export function getInitiativeOverviewPath(id: string): string {
	return path.join(getInitiativePath(id), "overview.md");
}

// Helper function to get spec.md path for an initiative
export function getInitiativeSpecPath(id: string): string {
	return path.join(getInitiativePath(id), "spec.md");
}

// Helper function to get tasks.json path for an initiative
export function getInitiativeTasksPath(id: string): string {
	return path.join(getInitiativePath(id), "tasks.json");
}

// Helper function to get decisions directory path for an initiative
export function getInitiativeDecisionsPath(id: string): string {
	return path.join(getInitiativePath(id), "decisions");
}

// Helper function to get decisions.json path for an initiative
export function getInitiativeDecisionsJsonPath(id: string): string {
	return path.join(getInitiativeDecisionsPath(id), "decisions.json");
}

// Helper function to get solutions directory path for an initiative
export function getInitiativeSolutionsPath(id: string): string {
	return path.join(getInitiativePath(id), "solutions");
}

// Helper function to get solutions.json path for an initiative
export function getInitiativeSolutionsJsonPath(id: string): string {
	return path.join(getInitiativeSolutionsPath(id), "solutions.json");
}

// Helper function to get patterns directory path for an initiative
export function getInitiativePatternsPath(id: string): string {
	return path.join(getInitiativePath(id), "patterns");
}

// Helper function to get patterns.json path for an initiative
export function getInitiativePatternsJsonPath(id: string): string {
	return path.join(getInitiativePatternsPath(id), "patterns.json");
}

// Helper function to get issues directory path for an initiative
export function getInitiativeIssuesPath(id: string): string {
	return path.join(getInitiativePath(id), "issues");
}

// Helper function to get specific issue directory path
export function getIssueDataPath(
	initiativeId: string,
	issueId: string,
): string {
	return path.join(getInitiativeIssuesPath(initiativeId), issueId, "data.json");
}

// Helper function to get issue directory path
export function getIssueDirectoryPath(
	initiativeId: string,
	issueId: string,
): string {
	return path.join(getInitiativeIssuesPath(initiativeId), issueId);
}
