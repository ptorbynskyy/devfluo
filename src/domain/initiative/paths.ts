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
