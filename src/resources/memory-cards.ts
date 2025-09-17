// ABOUTME: Memory cards resources that provide memory card data via MCP resources

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	getGlobalMemoryCardNames,
	getInitiativeMemoryCardNames,
	loadGlobalMemoryCard,
	loadGlobalMemoryCards,
	loadInitiativeMemoryCard,
	loadInitiativeMemoryCards,
} from "../domain/memory-cards.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

export function setupMemoryCardsResources(server: McpServer): void {
	// Static resource: List of all global memory cards
	server.registerResource(
		"memory-cards",
		"project://memory-cards",
		{
			title: "Global Memory Cards",
			description: "List of all global memory cards with name, title, and tags",
			mimeType: "application/json",
		},
		async (uri: URL) => {
			try {
				await ensureProjectInitialized();

				const memoryCards = await loadGlobalMemoryCards();
				const cardSummaries = memoryCards.map((card) => ({
					name: card.name,
					title: card.title,
					tags: card.tags,
				}));

				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(cardSummaries, null, 2),
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read global memory cards resource: ${uri.href}`,
				);
			}
		},
	);

	// ResourceTemplate: Individual global memory card with completion
	server.registerResource(
		"memory-card-item",
		new ResourceTemplate("project://memory-cards/item/{name}", {
			list: async () => {
				try {
					await ensureProjectInitialized();

					const memoryCardNames = await getGlobalMemoryCardNames();
					return {
						resources: memoryCardNames.map((name) => ({
							name: `memory-card-item-${name}`,
							uri: `project://memory-cards/item/${name}`,
							title: `Memory Card: ${name}`,
							description: `Individual global memory card with name: ${name}`,
							mimeType: "text/markdown",
						})),
					};
				} catch (error) {
					console.error("Error listing global memory cards", error);
					return { resources: [] };
				}
			},
			complete: {
				name: async (value) => {
					try {
						await ensureProjectInitialized();

						const memoryCardNames = await getGlobalMemoryCardNames();
						return memoryCardNames.filter((name) =>
							name.startsWith(value || ""),
						);
					} catch (error) {
						console.error("Error fetching global memory card names", error);
						return [];
					}
				},
			},
		}),
		{
			title: "Global Memory Card Item",
			description: "Individual global memory card with full content",
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
				await ensureProjectInitialized();

				const memoryCard = await loadGlobalMemoryCard(name);

				if (!memoryCard) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Global memory card '${name}' not found`,
					);
				}

				// Format as markdown
				let markdown = `# ${memoryCard.title}\n\n`;
				markdown += `**Name:** ${memoryCard.name}\n\n`;
				markdown += `**Context Including Policy:** ${memoryCard.contextIncludingPolicy}\n\n`;
				markdown += `**Tags:** ${memoryCard.tags.join(", ")}\n\n`;
				markdown += `## Content\n\n`;
				markdown += memoryCard.content;

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
					`Failed to read global memory card '${name}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);

	// ResourceTemplate: List of initiative memory cards
	server.registerResource(
		"initiative-memory-cards",
		new ResourceTemplate("project://initiatives/{initiativeId}/memory-cards", {
			list: async () => {
				// This will be populated dynamically based on existing initiatives
				return { resources: [] };
			},
			complete: {
				initiativeId: async (_value) => {
					// TODO: Implement initiative ID completion when needed
					return [];
				},
			},
		}),
		{
			title: "Initiative Memory Cards",
			description: "List of all memory cards for a specific initiative",
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
				await ensureProjectInitialized();

				const memoryCards = await loadInitiativeMemoryCards(initiativeId);
				const cardSummaries = memoryCards.map((card) => ({
					name: card.name,
					title: card.title,
					tags: card.tags,
				}));

				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(cardSummaries, null, 2),
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read initiative memory cards resource: ${uri.href}`,
				);
			}
		},
	);

	// ResourceTemplate: Individual initiative memory card with completion
	server.registerResource(
		"initiative-memory-card-item",
		new ResourceTemplate(
			"project://initiatives/{initiativeId}/memory-cards/item/{name}",
			{
				list: async () => {
					// This will be populated dynamically based on existing initiatives
					return { resources: [] };
				},
				complete: {
					initiativeId: async (_value) => {
						// TODO: Implement initiative ID completion when needed
						return [];
					},
					name: async (value, variables) => {
						try {
							await ensureProjectInitialized();

							const initiativeId = variables?.arguments?.initiativeId;
							if (typeof initiativeId !== "string") {
								return [];
							}

							const memoryCardNames =
								await getInitiativeMemoryCardNames(initiativeId);
							return memoryCardNames.filter((name) =>
								name.startsWith(value || ""),
							);
						} catch (error) {
							console.error(
								"Error fetching initiative memory card names",
								error,
							);
							return [];
						}
					},
				},
			},
		),
		{
			title: "Initiative Memory Card Item",
			description: "Individual initiative memory card with full content",
			mimeType: "text/markdown",
		},
		async (uri: URL, variables) => {
			const initiativeId = variables.initiativeId;
			const name = variables.name;

			if (typeof initiativeId !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing initiativeId parameter",
				);
			}

			if (typeof name !== "string") {
				throw new McpError(
					ErrorCode.InvalidRequest,
					"Invalid or missing name parameter",
				);
			}

			try {
				await ensureProjectInitialized();

				const memoryCard = await loadInitiativeMemoryCard(initiativeId, name);

				if (!memoryCard) {
					throw new McpError(
						ErrorCode.InvalidRequest,
						`Initiative memory card '${name}' not found in initiative '${initiativeId}'`,
					);
				}

				// Format as markdown
				let markdown = `# ${memoryCard.title}\n\n`;
				markdown += `**Name:** ${memoryCard.name}\n\n`;
				markdown += `**Initiative:** ${initiativeId}\n\n`;
				markdown += `**Context Including Policy:** ${memoryCard.contextIncludingPolicy}\n\n`;
				markdown += `**Tags:** ${memoryCard.tags.join(", ")}\n\n`;
				markdown += `## Content\n\n`;
				markdown += memoryCard.content;

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
					`Failed to read initiative memory card '${name}' in initiative '${initiativeId}': ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
