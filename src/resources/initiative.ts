// ABOUTME: Initiative resources with ResourceTemplate and completion support

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	generateTasksMarkdownReport,
	getInitiativeIds,
	loadInitiative,
	loadInitiatives,
} from "../domain/initiative/index.js";
import {
	getIssueIds,
	loadIssue,
	loadIssues,
} from "../domain/initiative/issues.js";
import { loadTasks } from "../domain/initiative/tasks.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

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
				// Ensure project is initialized
				await ensureProjectInitialized();

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
					// Ensure project is initialized
					await ensureProjectInitialized();

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
						// Ensure project is initialized
						await ensureProjectInitialized();

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
				// Ensure project is initialized
				await ensureProjectInitialized();

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
					markdown += generateTasksMarkdownReport(tasks);
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

	// ResourceTemplate: List issues for an initiative
	server.registerResource(
		"initiative-issues",
		new ResourceTemplate("project://initiative/issues/{initiativeId}", {
			list: async () => {
				try {
					// Ensure project is initialized
					await ensureProjectInitialized();

					const initiativeIds = await getInitiativeIds();
					return {
						resources: initiativeIds.map((id) => ({
							name: `initiative-issues-${id}`,
							uri: `project://initiative/issues/${id}`,
							title: `Issues for Initiative: ${id}`,
							description: `List of issues for initiative with ID: ${id}`,
							mimeType: "application/json",
						})),
					};
				} catch (error) {
					console.error("Error listing initiatives for issues", error);
					return { resources: [] };
				}
			},
			complete: {
				initiativeId: async (value) => {
					try {
						// Ensure project is initialized
						await ensureProjectInitialized();

						const initiativeIds = await getInitiativeIds();
						return initiativeIds.filter((id) => id.startsWith(value || ""));
					} catch (error) {
						console.error("Error fetching initiative IDs for issues", error);
						return [];
					}
				},
			},
		}),
		{
			title: "Initiative Issues",
			description: "List of all issues for a specific initiative",
			mimeType: "application/json",
		},
		async (uri: URL, variables) => {
			const initiativeId = variables.initiativeId;
			if (typeof initiativeId !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing initiativeId parameter",
				);
			}

			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				const issues = await loadIssues(initiativeId);

				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(issues, null, 2),
						},
					],
				};
			} catch (error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read issues for initiative '${initiativeId}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);

	// ResourceTemplate: Specific issue within an initiative
	server.registerResource(
		"initiative-issue",
		new ResourceTemplate(
			"project://initiative/issues/{initiativeId}/{issueId}",
			{
				list: async () => {
					try {
						// Ensure project is initialized
						await ensureProjectInitialized();

						const initiativeIds = await getInitiativeIds();
						const resources = [];

						for (const initiativeId of initiativeIds) {
							const issueIds = await getIssueIds(initiativeId);
							for (const issueId of issueIds) {
								resources.push({
									name: `initiative-issue-${initiativeId}-${issueId}`,
									uri: `project://initiative/issues/${initiativeId}/${issueId}`,
									title: `Issue: ${issueId} (Initiative: ${initiativeId})`,
									description: `Individual issue with ID: ${issueId} in initiative: ${initiativeId}`,
									mimeType: "application/json",
								});
							}
						}

						return { resources };
					} catch (error) {
						console.error("Error listing issues", error);
						return { resources: [] };
					}
				},
				complete: {
					initiativeId: async (value) => {
						try {
							// Ensure project is initialized
							await ensureProjectInitialized();

							const initiativeIds = await getInitiativeIds();
							return initiativeIds.filter((id) => id.startsWith(value || ""));
						} catch (error) {
							console.error("Error fetching initiative IDs for issue", error);
							return [];
						}
					},
					issueId: async (value, context) => {
						try {
							// Ensure project is initialized
							await ensureProjectInitialized();

							const initiativeId = context?.arguments?.initiativeId;
							if (typeof initiativeId !== "string") {
								return [];
							}
							const issueIds = await getIssueIds(initiativeId);
							return issueIds.filter((id) => id.startsWith(value || ""));
						} catch (error) {
							console.error("Error fetching issue IDs", error);
							return [];
						}
					},
				},
			},
		),
		{
			title: "Initiative Issue",
			description: "Individual issue within an initiative with full details",
			mimeType: "application/json",
		},
		async (uri: URL, variables) => {
			const initiativeId = variables.initiativeId;
			const issueId = variables.issueId;

			if (typeof initiativeId !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing initiativeId parameter",
				);
			}

			if (typeof issueId !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing issueId parameter",
				);
			}

			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				const issue = await loadIssue(initiativeId, issueId);

				if (!issue) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Issue '${issueId}' not found in initiative '${initiativeId}'`,
					);
				}

				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(issue, null, 2),
						},
					],
				};
			} catch (error) {
				if (error instanceof McpError) {
					throw error;
				}
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read issue '${issueId}' in initiative '${initiativeId}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
