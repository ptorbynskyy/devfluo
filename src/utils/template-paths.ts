// ABOUTME: Consolidated template path resolution utilities for MCP server templates

import { dirname, join } from "node:path";

/**
 * Get the directory path for shared templates
 * These are reusable template components used across contexts
 * @returns Path to build/templates/ directory
 */
export function getSharedTemplatesDir(): string {
	return join(dirname(new URL(import.meta.url).pathname), "..", "templates");
}

/**
 * Get the full path to a specific markdown template file
 * @param templateName - Name of the template file (e.g., "architecture-template.md")
 * @returns Full path to the template file
 */
export function getMarkdownTemplatePath(templateName: string): string {
	return join(
		join(dirname(new URL(import.meta.url).pathname), "..", "templates"),
		templateName,
	);
}
