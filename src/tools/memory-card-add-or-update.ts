// ABOUTME: Tool for adding or updating memory cards by scope and name

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	type MemoryCardAddOrUpdate,
	MemoryCardAddOrUpdateSchema,
	MemoryCardSchema,
} from "../domain/memory-card-schema.js";
import { indexMemoryCard } from "../domain/memory-card-search.js";
import {
	loadGlobalMemoryCard,
	loadInitiativeMemoryCard,
	saveGlobalMemoryCard,
	saveInitiativeMemoryCard,
} from "../domain/memory-cards.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

export async function handleMemoryCardAddOrUpdateTool(
	input: MemoryCardAddOrUpdate,
) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

		// Validate input
		const validatedInput = MemoryCardAddOrUpdateSchema.parse(input);

		// Create memory card object
		const memoryCard = MemoryCardSchema.parse({
			name: validatedInput.name,
			title: validatedInput.title,
			content: validatedInput.content,
			contextIncludingPolicy: validatedInput.contextIncludingPolicy,
			tags: validatedInput.tags,
		});

		let isUpdate = false;
		let scopeDescription = "";

		if (validatedInput.scope === "global") {
			// Check if global memory card exists
			const existingCard = await loadGlobalMemoryCard(validatedInput.name);
			isUpdate = existingCard !== null;

			// Save global memory card
			await saveGlobalMemoryCard(memoryCard);

			// Index in ChromaDB
			try {
				await indexMemoryCard(memoryCard, "global");
			} catch (indexError) {
				console.error("Failed to index global memory card:", indexError);
				// Don't fail the operation if indexing fails
			}

			scopeDescription = "global scope";
		} else {
			// Initiative scope
			const initiativeId = validatedInput.scope;

			// Check if initiative memory card exists
			const existingCard = await loadInitiativeMemoryCard(
				initiativeId,
				validatedInput.name,
			);
			isUpdate = existingCard !== null;

			// Save initiative memory card
			await saveInitiativeMemoryCard(initiativeId, memoryCard);

			// Index in ChromaDB
			try {
				await indexMemoryCard(memoryCard, initiativeId);
			} catch (indexError) {
				console.error("Failed to index initiative memory card:", indexError);
				// Don't fail the operation if indexing fails
			}

			scopeDescription = `initiative '${initiativeId}'`;
		}

		const action = isUpdate ? "updated" : "created";

		return {
			content: [
				{
					type: "text" as const,
					text: `Successfully ${action} memory card '${validatedInput.name}' in ${scopeDescription}`,
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
				`Validation error: ${errorDetails}. Example: {"scope": "global", "name": "api-patterns", "title": "API Design Patterns", "content": "# API Patterns\\n\\nCollection of proven API patterns...", "contextIncludingPolicy": "auto", "tags": ["api", "patterns", "design"]}`,
			);
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Failed to add or update memory card: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupMemoryCardAddOrUpdateTool(server: McpServer): void {
	server.registerTool(
		"memory_card_add_or_update",
		{
			title: "Add or Update Memory Card",
			description:
				"Add a new memory card or update an existing one. Use 'global' for global scope or provide an initiative ID for initiative scope. The tool automatically detects if the card exists and performs update or create accordingly.",
			inputSchema: MemoryCardAddOrUpdateSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args: MemoryCardAddOrUpdate) => {
			return await handleMemoryCardAddOrUpdateTool(args);
		},
	);
}
