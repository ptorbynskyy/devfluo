import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

export const baseKnowledgePath = path.join(config.PROJECT_ROOT, "base");
const codebasePath = path.join(baseKnowledgePath, "codebase.md");
const architecturePath = path.join(baseKnowledgePath, "architecture.md");

export function saveArchitectureMarkDown(content: string): Promise<void> {
	return writeFile(architecturePath, content, "utf-8");
}

export async function saveCodebaseMarkdown(content: string): Promise<void> {
	return writeFile(codebasePath, content, "utf-8");
}

export async function getArchitectureKnowledge(): Promise<string | null> {
	try {
		const architectureContent = await readFile(architecturePath, "utf-8");
		return architectureContent;
	} catch (_error) {
		return null;
	}
}

export async function getCodebaseKnowledge(): Promise<string | null> {
	try {
		const codebaseContent = await readFile(codebasePath, "utf-8");
		return codebaseContent;
	} catch (_error) {
		return null;
	}
}
