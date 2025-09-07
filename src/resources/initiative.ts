// ABOUTME: Initiative resources with ResourceTemplate and completion support

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	getInitiativeIds,
	loadInitiative,
	loadInitiatives,
} from "../domain/initiative/index.js";
import { loadTasks } from "../domain/initiative/tasks.js";

export function setupInitiativeResources(server: McpServer): void {
	// Static resource: List of all initiatives
	server.registerResource(
		"initiative-list",
		"project://initiative/list",
		{
			title: "Initiatives List",
			description: "List of all initiatives with basic information",
			mimeType: "application/json",
		},
		async (uri: URL) => {
			try {
				const initiatives = await loadInitiatives();

				// Return list format without overview/spec content
				const listInitiatives = initiatives.map((initiative) => ({
					id: initiative.id,
					name: initiative.name,
					state: initiative.state,
					hasOverview: initiative.hasOverview,
					hasSpec: initiative.hasSpec,
				}));

				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(listInitiatives, null, 2),
						},
					],
				};
			} catch (error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read initiatives list: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);

	// ResourceTemplate: Individual initiative with completion
	server.registerResource(
		"initiative-item",
		new ResourceTemplate("project://initiative/item/{id}", {
			list: async () => {
				try {
					const initiativeIds = await getInitiativeIds();
					return {
						resources: initiativeIds.map((id) => ({
							name: `initiative-item-${id}`,
							uri: `project://initiative/item/${id}`,
							title: `Initiative: ${id}`,
							description: `Individual initiative with ID: ${id}`,
							mimeType: "text/markdown",
						})),
					};
				} catch (error) {
					console.error("Error listing initiatives", error);
					return { resources: [] };
				}
			},
			complete: {
				id: async (value) => {
					try {
						const initiativeIds = await getInitiativeIds();
						return initiativeIds.filter((id) => id.startsWith(value || ""));
					} catch (error) {
						console.error("Error fetching initiative IDs", error);
						// Return empty array on error
						return [];
					}
				},
			},
		}),
		{
			title: "Initiative Item",
			description:
				"Individual initiative with full details and overview content",
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
				const initiative = await loadInitiative(id);

				if (!initiative) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Initiative '${id}' not found`,
					);
				}

				// Format as markdown
				let markdown = `# ${initiative.name}\n\n`;
				markdown += `**ID:** ${initiative.id}\n\n`;
				markdown += `**State:** ${initiative.state}\n\n`;

				if (initiative.hasOverview && initiative.overview) {
					markdown += `## Overview\n\n`;
					markdown += initiative.overview;
				} else {
					markdown += `## Overview\n\n`;
					markdown += `*No overview provided*`;
				}

				markdown += `\n\n`;

				if (initiative.hasSpec && initiative.spec) {
					markdown += `## Specification\n\n`;
					markdown += initiative.spec;
				} else {
					markdown += `## Specification\n\n`;
					markdown += `*No specification provided*`;
				}

				markdown += `\n\n`;

				// Load and display tasks
				const tasks = await loadTasks(id);
				if (tasks.length > 0) {
					markdown += `## Tasks Breakdown\n\n`;

					// Group tasks by phase
					const tasksByPhase = tasks.reduce(
						(acc, task) => {
							const phaseTasks = acc[task.phase] ?? [];
							phaseTasks.push(task);
							acc[task.phase] = phaseTasks;
							return acc;
						},
						{} as Record<number, typeof tasks>,
					);

					// Sort phases by number
					const phases = Object.keys(tasksByPhase)
						.map(Number)
						.sort((a, b) => a - b);

					for (const phaseNum of phases) {
						const phaseTasks = tasksByPhase[phaseNum];
						if (!phaseTasks) continue;
						markdown += `### Phase ${phaseNum}\n\n`;

						// Create table
						markdown += `| ID | Name | Effort | Status | Description |\n`;
						markdown += `|---|---|---|---|---|\n`;

						// Sort tasks by order within phase
						const sortedTasks = phaseTasks.sort((a, b) => a.order - b.order);

						for (const task of sortedTasks) {
							const effort = task.effort || "-";
							const status = task.status === "done" ? "✅ Done" : "🔲 New";
							markdown += `| ${task.id} | ${task.name} | ${effort} | ${status} | ${task.description} |\n`;
						}

						markdown += `\n`;
					}
				} else {
					markdown += `## Tasks Breakdown\n\n`;
					markdown += `*No tasks defined*\n\n`;
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
					`Failed to read initiative '${id}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
