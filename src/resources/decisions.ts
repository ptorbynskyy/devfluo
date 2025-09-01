// ABOUTME: Decisions resource that reads decision data from JSON file

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { loadDecisions } from "../domain/decisions.js";

export function setupDecisionsResource(server: McpServer): void {
	server.registerResource(
		"decisions",
		"project://decisions",
		{
			title: "Project Decisions",
			description: "List of all project decisions from decisions.json file",
			mimeType: "application/json",
		},
		async (uri: URL) => {
			try {
				const decisions = await loadDecisions();
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(decisions, null, 2),
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read decisions resource: ${uri.href}`,
				);
			}
		},
	);
}
