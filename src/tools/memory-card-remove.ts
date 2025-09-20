// ABOUTME: Tool for removing memory cards by scope and name

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	type MemoryCardRemove,
	MemoryCardRemoveSchema,
} from "../domain/memory/memory-card-schema.js";
import { removeFromIndex } from "../domain/memory/memory-card-search.js";
import {
	removeGlobalMemoryCard,
	removeInitiativeMemoryCard,
} from "../domain/memory/memory-cards.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

export async function handleMemoryCardRemoveTool(input: MemoryCardRemove) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

		// Validate input
		const validatedInput = MemoryCardRemoveSchema.parse(input);

		let removed = false;
		let scopeDescription = "";

		if (validatedInput.scope === "global") {
			// Remove global memory card
			removed = await removeGlobalMemoryCard(validatedInput.name);

			// Remove from ChromaDB index
			if (removed) {
				try {
					await removeFromIndex("global", validatedInput.name);
				} catch (indexError) {
					console.error(
						"Failed to remove global memory card from index:",
						indexError,
					);
					// Don't fail the operation if index removal fails
				}
			}

			scopeDescription = "global scope";
		} else {
			// Initiative scope
			const initiativeId = validatedInput.scope;

			// Remove initiative memory card
			removed = await removeInitiativeMemoryCard(
				initiativeId,
				validatedInput.name,
			);

			// Remove from ChromaDB index
			if (removed) {
				try {
					await removeFromIndex(initiativeId, validatedInput.name);
				} catch (indexError) {
					console.error(
						"Failed to remove initiative memory card from index:",
						indexError,
					);
					// Don't fail the operation if index removal fails
				}
			}

			scopeDescription = `initiative '${initiativeId}'`;
		}

		if (!removed) {
			throw new McpError(
				ErrorCode.InvalidRequest,
				`Memory card '${validatedInput.name}' not found in ${scopeDescription}`,
			);
		}

		return {
			content: [
				{
					type: "text" as const,
					text: `Successfully removed memory card '${validatedInput.name}' from ${scopeDescription}`,
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
				`Validation error: ${errorDetails}. Example: {"scope": "global", "name": "api-patterns"} or {"scope": "user-auth-initiative", "name": "oauth-config"}`,
			);
		}

		if (error instanceof McpError) {
			throw error;
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Failed to remove memory card: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupMemoryCardRemoveTool(server: McpServer): void {
	server.registerTool(
		"memory_card_remove",
		{
			title: "Remove Memory Card",
			description:
				"Remove a memory card by name and scope. Use 'global' for global scope or provide an initiative ID for initiative scope.",
			inputSchema: MemoryCardRemoveSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args: MemoryCardRemove) => {
			return await handleMemoryCardRemoveTool(args);
		},
	);
}
