// ABOUTME: Tool for deleting initiatives by ID

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	deleteInitiative,
	type InitiativeDeleteInput,
	InitiativeDeleteSchema,
} from "../domain/initiative/index.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

export async function handleInitiativeDeleteTool(input: InitiativeDeleteInput) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

		// Validate input
		const validatedInput = InitiativeDeleteSchema.parse(input);

		// Delete the initiative
		await deleteInitiative(validatedInput.id);

		return {
			content: [
				{
					type: "text" as const,
					text: `Successfully deleted initiative '${validatedInput.id}' and all its files`,
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
				`Validation error: ${errorDetails}. Example: {"id": "user-auth"}`,
			);
		}

		if (error instanceof Error && error.message.includes("does not exist")) {
			throw new McpError(ErrorCode.InvalidParams, error.message);
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Failed to delete initiative: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupInitiativeDeleteTool(server: McpServer): void {
	server.registerTool(
		"initiative_delete",
		{
			title: "Delete Initiative",
			description:
				"Delete an initiative by ID. This will permanently remove the initiative folder and all its files (data.json and overview.md).",
			inputSchema: InitiativeDeleteSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (args: InitiativeDeleteInput) => {
			return await handleInitiativeDeleteTool(args);
		},
	);
}
