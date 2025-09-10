// ABOUTME: Patterns resource that reads pattern data from JSON file

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	getPatternIds,
	loadPattern,
	loadPatterns,
	patternsPath,
} from "../domain/patterns.js";

export function setupPatternsResource(server: McpServer): void {
	// Static resource: List of all patterns
	server.registerResource(
		"patterns",
		"project://patterns",
		{
			title: "Project Patterns",
			description: "List of all project patterns from patterns.json file",
			mimeType: "application/json",
		},
		async (uri: URL) => {
			try {
				const patterns = await loadPatterns();
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(patterns, null, 2),
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read patterns resource: ${uri.href}`,
				);
			}
		},
	);

	// ResourceTemplate: Individual pattern with completion
	server.registerResource(
		"pattern-item",
		new ResourceTemplate("project://patterns/item/{name}", {
			list: async () => {
				try {
					const patternIds = await getPatternIds();
					return {
						resources: patternIds.map((name) => ({
							name: `pattern-item-${name}`,
							uri: `project://patterns/item/${name}`,
							title: `Pattern: ${name}`,
							description: `Individual pattern with name: ${name}`,
							mimeType: "text/markdown",
						})),
					};
				} catch (error) {
					console.error("Error listing patterns", error);
					return { resources: [] };
				}
			},
			complete: {
				name: async (value) => {
					try {
						const patternIds = await getPatternIds();
						return patternIds.filter((name) => name.startsWith(value || ""));
					} catch (error) {
						console.error("Error fetching pattern IDs", error);
						return [];
					}
				},
			},
		}),
		{
			title: "Pattern Item",
			description: "Individual pattern with full details and code snippet",
			mimeType: "text/markdown",
		},
		async (uri: URL, variables) => {
			const name = variables.name;
			if (typeof name !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing name parameter",
				);
			}

			try {
				const pattern = await loadPattern(name);

				if (!pattern) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Pattern '${name}' not found`,
					);
				}

				// Read snippet content from file
				let snippetContent = "";
				try {
					const snippetPath = path.join(patternsPath, pattern.snippetFilename);
					snippetContent = await readFile(snippetPath, "utf-8");
				} catch (error) {
					snippetContent = `*Error reading snippet file: ${error instanceof Error ? error.message : "Unknown error"}*`;
				}

				// Format as markdown
				let markdown = `# ${pattern.name}\n\n`;
				markdown += `**Description:** ${pattern.description}\n\n`;
				markdown += `**Tags:** ${pattern.tags.join(", ")}\n\n`;
				markdown += `**Snippet Filename:** ${pattern.snippetFilename}\n\n`;

				if (pattern.codeReferences && pattern.codeReferences.length > 0) {
					markdown += `**Code References:**\n`;
					for (const reference of pattern.codeReferences) {
						markdown += `- ${reference}\n`;
					}
					markdown += `\n`;
				}

				markdown += `## Code Snippet\n\n`;
				markdown += `\`\`\`\n${snippetContent}\n\`\`\`\n`;

				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/markdown",
							text: markdown,
						},
					],
				};
			} catch (error) {
				if (error instanceof McpError) {
					throw error;
				}
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read pattern '${name}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
