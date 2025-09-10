// ABOUTME: Solutions resource that reads solution data from JSON file

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	getSolutionIds,
	loadSolution,
	loadSolutions,
} from "../domain/solutions.js";

export function setupSolutionsResource(server: McpServer): void {
	// Static resource: List of all solutions
	server.registerResource(
		"solutions",
		"project://solutions",
		{
			title: "Project Solutions",
			description: "List of all project solutions from solutions.json file",
			mimeType: "application/json",
		},
		async (uri: URL) => {
			try {
				const solutions = await loadSolutions();
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(solutions, null, 2),
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read solutions resource: ${uri.href}`,
				);
			}
		},
	);

	// ResourceTemplate: Individual solution with completion
	server.registerResource(
		"solution-item",
		new ResourceTemplate("project://solutions/item/{key}", {
			list: async () => {
				try {
					const solutionIds = await getSolutionIds();
					return {
						resources: solutionIds.map((key) => ({
							name: `solution-item-${key}`,
							uri: `project://solutions/item/${key}`,
							title: `Solution: ${key}`,
							description: `Individual solution with key: ${key}`,
							mimeType: "text/markdown",
						})),
					};
				} catch (error) {
					console.error("Error listing solutions", error);
					return { resources: [] };
				}
			},
			complete: {
				key: async (value) => {
					try {
						const solutionIds = await getSolutionIds();
						return solutionIds.filter((key) => key.startsWith(value || ""));
					} catch (error) {
						console.error("Error fetching solution IDs", error);
						return [];
					}
				},
			},
		}),
		{
			title: "Solution Item",
			description: "Individual solution with full details",
			mimeType: "text/markdown",
		},
		async (uri: URL, variables) => {
			const key = variables.key;
			if (typeof key !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing key parameter",
				);
			}

			try {
				const solution = await loadSolution(key);

				if (!solution) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Solution '${key}' not found`,
					);
				}

				// Format as markdown
				let markdown = `# ${solution.problem}\n\n`;
				markdown += `**Solution:** ${solution.solution}\n\n`;
				markdown += `**Tags:** ${solution.tags.join(", ")}\n\n`;

				if (solution.codeReferences && solution.codeReferences.length > 0) {
					markdown += `**Code References:**\n`;
					for (const reference of solution.codeReferences) {
						markdown += `- ${reference}\n`;
					}
					markdown += `\n`;
				}

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
					`Failed to read solution '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
