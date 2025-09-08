// ABOUTME: Consolidated template path resolution utilities for MCP server templates

import { dirname, join } from "node:path";

/**
 * Get the directory path for markdown templates
 * These are general project templates like architecture, codebase documentation
 * @returns Path to build/templates/ directory
 */
export function getMarkdownTemplatesDir(): string {
	return join(
		dirname(new URL(import.meta.url).pathname),
		"..",
		"..",
		"build",
		"templates",
	);
}

/**
 * Get the directory path for ETA prompt templates
 * These are ETA templates used for MCP prompt rendering
 * @returns Path to build/prompts/templates/ directory
 */
export function getPromptTemplatesDir(): string {
	return join(
		dirname(new URL(import.meta.url).pathname),
		"..",
		"..",
		"build",
		"prompts",
		"templates",
	);
}

/**
 * Get the full path to a specific markdown template file
 * @param templateName - Name of the template file (e.g., "architecture-template.md")
 * @returns Full path to the template file
 */
export function getMarkdownTemplatePath(templateName: string): string {
	return join(getMarkdownTemplatesDir(), templateName);
}

/**
 * Get the full path to a specific ETA prompt template file
 * @param templateName - Name of the template file (e.g., "backlog-specification.eta")
 * @returns Full path to the template file
 */
export function getPromptTemplatePath(templateName: string): string {
	return join(getPromptTemplatesDir(), templateName);
}
