// ABOUTME: Patterns resource that reads pattern data from JSON file

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { loadPatterns } from "../domain/patterns.js";

export function setupPatternsResource(server: McpServer): void {
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
}
