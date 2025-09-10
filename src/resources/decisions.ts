// ABOUTME: Decisions resource that reads decision data from JSON file

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	getDecisionIds,
	loadDecision,
	loadDecisions,
} from "../domain/decisions.js";

export function setupDecisionsResource(server: McpServer): void {
	// Static resource: List of all decisions
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

	// ResourceTemplate: Individual decision with completion
	server.registerResource(
		"decision-item",
		new ResourceTemplate("project://decisions/item/{name}", {
			list: async () => {
				try {
					const decisionIds = await getDecisionIds();
					return {
						resources: decisionIds.map((name) => ({
							name: `decision-item-${name}`,
							uri: `project://decisions/item/${name}`,
							title: `Decision: ${name}`,
							description: `Individual decision with name: ${name}`,
							mimeType: "text/markdown",
						})),
					};
				} catch (error) {
					console.error("Error listing decisions", error);
					return { resources: [] };
				}
			},
			complete: {
				name: async (value) => {
					try {
						const decisionIds = await getDecisionIds();
						return decisionIds.filter((name) => name.startsWith(value || ""));
					} catch (error) {
						console.error("Error fetching decision IDs", error);
						return [];
					}
				},
			},
		}),
		{
			title: "Decision Item",
			description: "Individual decision with full details",
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
				const decision = await loadDecision(name);

				if (!decision) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Decision '${name}' not found`,
					);
				}

				// Format as markdown
				let markdown = `# ${decision.name}\n\n`;
				markdown += `**Description:** ${decision.description}\n\n`;
				markdown += `**Tags:** ${decision.tags.join(", ")}\n\n`;

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
					`Failed to read decision '${name}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
