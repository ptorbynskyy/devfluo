import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { getMarkdownTemplatePath } from "../utils/template-paths.js";

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

export async function isInitialized(): Promise<false | string> {
	const isArchitectureInitialized = await access(architecturePath)
		.then(() => true)
		.catch(() => false);
	const isCodebaseInitialized = await access(codebasePath)
		.then(() => true)
		.catch(() => false);

	return isArchitectureInitialized && isCodebaseInitialized
		? config.PROJECT_ROOT
		: false;
}

export async function init(): Promise<{
	root: string;
}> {
	// Create base directory
	await mkdir(baseKnowledgePath, { recursive: true });

	// Read template files
	const architectureTemplate = await readFile(
		getMarkdownTemplatePath("architecture-template.md"),
		"utf-8",
	);
	const codebaseTemplate = await readFile(
		getMarkdownTemplatePath("codebase-template.md"),
		"utf-8",
	);

	// Write markdown files
	await writeFile(architecturePath, architectureTemplate);
	await writeFile(codebasePath, codebaseTemplate);

	return {
		root: config.PROJECT_ROOT,
	};
}
