// ABOUTME: Tool for updating existing initiatives by ID

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { updateInitiative } from "../domain/initiative.js";
import {
	type InitiativeUpdateInput,
	InitiativeUpdateSchema,
} from "../domain/initiative-schema.js";

export async function handleInitiativeUpdateTool(input: InitiativeUpdateInput) {
	try {
		// Validate input
		const validatedInput = InitiativeUpdateSchema.parse(input);

		// Update the initiative
		await updateInitiative(validatedInput);

		const changes: string[] = [];
		if (validatedInput.name !== undefined) {
			changes.push("name");
		}
		if (validatedInput.state !== undefined) {
			changes.push("state");
		}
		if (validatedInput.overview !== undefined) {
			changes.push("overview content");
		}

		const changesText =
			changes.length > 0 ? ` (updated: ${changes.join(", ")})` : "";

		return {
			content: [
				{
					type: "text" as const,
					text: `Successfully updated initiative '${validatedInput.id}'${changesText}`,
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
				`Validation error: ${errorDetails}. Example: {"id": "user-auth", "name": "Updated User Authentication", "state": "inprogress", "overview": "# Updated Overview\\n\\nNew content..."}`,
			);
		}

		if (error instanceof Error && error.message.includes("does not exist")) {
			throw new McpError(ErrorCode.InvalidParams, error.message);
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Failed to update initiative: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupInitiativeUpdateTool(server: McpServer): void {
	server.registerTool(
		"initiative_update",
		{
			title: "Update Initiative",
			description:
				"Update an existing initiative by ID. All fields except ID are optional - only provided fields will be updated. Pass empty string or null for spec to delete spec file.",
			inputSchema: InitiativeUpdateSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args: InitiativeUpdateInput) => {
			return await handleInitiativeUpdateTool(args);
		},
	);
}
