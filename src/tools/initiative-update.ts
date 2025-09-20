// ABOUTME: Tool for updating existing initiatives by ID

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	type InitiativeUpdateInput,
	InitiativeUpdateSchema,
	updateInitiative,
} from "../domain/initiative/index.js";
import { processTaskOperations } from "../domain/initiative/tasks.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

export async function handleInitiativeUpdateTool(input: InitiativeUpdateInput) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

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

		// Process task operations if provided
		let taskResults = { insertCount: 0, updateCount: 0, deleteCount: 0 };
		if (validatedInput.tasks) {
			taskResults = await processTaskOperations(
				validatedInput.id,
				validatedInput.tasks,
			);
		}

		// Helper function to format entity changes
		function formatEntityChanges(
			entityName: string,
			results: {
				insertCount: number;
				updateCount: number;
				deleteCount: number;
			},
		): string[] {
			if (
				results.insertCount === 0 &&
				results.updateCount === 0 &&
				results.deleteCount === 0
			) {
				return [];
			}

			const entityChanges: string[] = [];
			if (results.insertCount > 0) {
				entityChanges.push(
					`${results.insertCount} ${entityName}${results.insertCount === 1 ? "" : "s"} created`,
				);
			}
			if (results.updateCount > 0) {
				entityChanges.push(
					`${results.updateCount} ${entityName}${results.updateCount === 1 ? "" : "s"} updated`,
				);
			}
			if (results.deleteCount > 0) {
				entityChanges.push(
					`${results.deleteCount} ${entityName}${results.deleteCount === 1 ? "" : "s"} deleted`,
				);
			}
			return [`${entityName}s (${entityChanges.join(", ")})`];
		}

		// Add entity changes to the changes list
		changes.push(...formatEntityChanges("task", taskResults));

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
				`Validation error: ${errorDetails}. Example: {"id": "user-auth", "name": "Updated User Authentication", "state": "inprogress", "overview": "# Updated Overview\\n\\nNew content...", "tasks": {"create": [{"id": "t001", "name": "Setup auth", "description": "Configure OAuth", "effort": "L", "status": "new", "order": 1, "phase": 1}]}, "decisions": {"create": [{"name": "auth-provider", "description": "Use OAuth2 for authentication", "tags": ["security"]}]}}`,
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
				"Update an existing initiative by ID. All fields except ID are optional - only provided fields will be updated. Pass empty string or null for spec to delete spec file. Use tasks, decisions, solutions, and patterns fields to manage knowledge within the initiative.",
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
