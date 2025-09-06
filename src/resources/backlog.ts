// ABOUTME: Backlog resources with ResourceTemplate and completion support

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	getBacklogItemIds,
	loadBacklogItem,
	loadBacklogItems,
} from "../domain/backlog.js";

export function setupBacklogResources(server: McpServer): void {
	// Static resource: List of all backlog items
	server.registerResource(
		"backlog-list",
		"project://backlog/list",
		{
			title: "Backlog Items List",
			description: "List of all backlog items with basic information",
			mimeType: "application/json",
		},
		async (uri: URL) => {
			try {
				const items = await loadBacklogItems();

				// Return list format without spec content
				const listItems = items.map((item) => ({
					id: item.id,
					name: item.name,
					description: item.description,
					effort: item.effort || null,
					hasSpec: item.hasSpec,
				}));

				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(listItems, null, 2),
						},
					],
				};
			} catch (error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read backlog list: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);

	// ResourceTemplate: Individual backlog item with completion
	server.registerResource(
		"backlog-item",
		new ResourceTemplate("project://backlog/item/{id}", {
			list: async () => {
				try {
					const itemIds = await getBacklogItemIds();
					return {
						resources: itemIds.map((id) => ({
							name: `backlog-item-${id}`,
							uri: `project://backlog/item/${id}`,
							title: `Backlog Item: ${id}`,
							description: `Individual backlog item with ID: ${id}`,
							mimeType: "text/markdown",
						})),
					};
				} catch (error) {
					console.error("Error listing backlog items", error);
					return { resources: [] };
				}
			},
			complete: {
				id: async (value) => {
					try {
						const itemIds = await getBacklogItemIds();
						return itemIds.filter((id) => id.startsWith(value || ""));
					} catch (error) {
						console.error("Error fetching backlog item IDs", error);
						// Return empty array on error
						return [];
					}
				},
			},
		}),
		{
			title: "Backlog Item",
			description:
				"Individual backlog item with full details and specification",
			mimeType: "text/markdown",
		},
		async (uri: URL, variables) => {
			const id = variables.id;
			if (typeof id !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing id parameter",
				);
			}

			try {
				const item = await loadBacklogItem(id);

				if (!item) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Backlog item '${id}' not found`,
					);
				}

				// Format as markdown
				let markdown = `# ${item.name}\n\n`;
				markdown += `**ID:** ${item.id}\n\n`;
				markdown += `**Description:** ${item.description}\n\n`;

				if (item.effort) {
					markdown += `**Effort:** ${item.effort}\n\n`;
				}

				if (item.hasSpec && item.spec) {
					markdown += `## Specification\n\n`;
					markdown += item.spec;
				} else {
					markdown += `## Specification\n\n`;
					markdown += `*No specification provided*`;
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
					`Failed to read backlog item '${id}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
