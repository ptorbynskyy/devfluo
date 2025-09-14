// ABOUTME: Tool for creating new initiatives with status "new"

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	createInitiative,
	type InitiativeCreateInput,
	InitiativeCreateSchema,
} from "../domain/initiative/index.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

export async function handleInitiativeCreateTool(input: InitiativeCreateInput) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

		// Validate input
		const validatedInput = InitiativeCreateSchema.parse(input);

		// Create the initiative
		await createInitiative(validatedInput);

		return {
			content: [
				{
					type: "text" as const,
					text: `Successfully created initiative '${validatedInput.id}' (${validatedInput.name}) with status "new"${validatedInput.overview ? " and overview content" : ""}`,
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
				`Validation error: ${errorDetails}. Example: {"id": "user-auth", "name": "User Authentication System", "overview": "# User Authentication\\n\\nThis initiative covers..."}`,
			);
		}

		if (error instanceof Error && error.message.includes("already exists")) {
			throw new McpError(ErrorCode.InvalidParams, error.message);
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Failed to create initiative: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupInitiativeCreateTool(server: McpServer): void {
	server.registerTool(
		"initiative_create",
		{
			title: "Create Initiative",
			description:
				"Create a new initiative with status 'new'. Can optionally create from existing backlog item (copies spec and deletes backlog). Each initiative gets its own folder with data.json for metadata, optional overview.md, and optional spec.md files.",
			inputSchema: InitiativeCreateSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (args: InitiativeCreateInput) => {
			return await handleInitiativeCreateTool(args);
		},
	);
}
