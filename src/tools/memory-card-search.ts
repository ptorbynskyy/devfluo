// ABOUTME: Tool for searching memory cards using semantic search

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { searchMemoryCardsWithExcerpts } from "../domain/memory-card-search.js";
import {
	type MemoryCardSearch,
	MemoryCardSearchSchema,
} from "../domain/memory-card-search-schema.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

export async function handleMemoryCardSearchTool(input: MemoryCardSearch) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

		// Validate input
		const validatedInput = MemoryCardSearchSchema.parse(input);

		// Perform semantic search with excerpts
		const searchResults = await searchMemoryCardsWithExcerpts(
			validatedInput.scope,
			validatedInput.query,
			validatedInput.limit,
		);

		if (searchResults.length === 0) {
			const scopeDescription =
				validatedInput.scope === "global"
					? "global scope"
					: `initiative '${validatedInput.scope}'`;

			return {
				content: [
					{
						type: "text" as const,
						text: `No memory cards found matching query "${validatedInput.query}" in ${scopeDescription}`,
					},
				],
			};
		}

		// Format search results with excerpts
		const resultsText = searchResults
			.map((result, index) => {
				const card = result.parentCard;
				const tagsText =
					card.tags.length > 0 ? `\nTags: ${card.tags.join(", ")}` : "";

				// Format excerpts
				const excerptsText =
					result.excerpts.length > 1
						? `\n\n**Relevant excerpts:**\n${result.excerpts
								.map(
									(excerpt, i) =>
										`${i + 1}. (Score: ${Math.round(excerpt.score * 100)}%)\n${excerpt.content}`,
								)
								.join("\n\n")}`
						: `\n\n${result.excerpts[0]?.content || ""}`;

				return `**${index + 1}. ${card.title}** (Relevance: ${Math.round(result.relevanceScore * 100)}%)
Name: ${card.name}${tagsText}
Context Policy: ${card.contextIncludingPolicy}${excerptsText}`;
			})
			.join("\n\n---\n\n");

		const scopeDescription =
			validatedInput.scope === "global"
				? "global scope"
				: `initiative '${validatedInput.scope}'`;

		return {
			content: [
				{
					type: "text" as const,
					text: `Found ${searchResults.length} memory cards matching "${validatedInput.query}" in ${scopeDescription}:\n\n${resultsText}`,
				},
			],
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorDetails = error.errors
				.map((e) => {
					const path = e.path.length > 0 ? ` at '${e.path.join(".")}'` : "";
					return `${e.message}${path}`;
				})
				.join(", ");

			throw new McpError(
				ErrorCode.InvalidParams,
				`Validation error: ${errorDetails}. Example: {"scope": "global", "query": "API authentication patterns", "limit": 10} or {"scope": "user-auth-initiative", "query": "OAuth configuration", "limit": 5}`,
			);
		}

		if (error instanceof McpError) {
			throw error;
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Failed to search memory cards: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupMemoryCardSearchTool(server: McpServer): void {
	server.registerTool(
		"memory_cards_search",
		{
			title: "Search Memory Cards",
			description:
				"Search memory cards using semantic search within a specific scope. Use 'global' for global scope or provide an initiative ID for initiative scope. Returns ranked results with relevance scores.",
			inputSchema: MemoryCardSearchSchema.shape,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args: MemoryCardSearch) => {
			return await handleMemoryCardSearchTool(args);
		},
	);
}
