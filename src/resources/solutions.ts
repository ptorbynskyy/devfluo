// ABOUTME: Solutions resource that reads solution data from JSON file

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { loadSolutions } from "../domain/solutions.js";

export function setupSolutionsResource(server: McpServer): void {
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
}
