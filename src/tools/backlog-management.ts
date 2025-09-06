// ABOUTME: Tool for managing backlog items with CRUD operations

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { BacklogOperationsSchema } from "../domain/backlog-schema.js";
import { processBacklogOperations } from "../domain/backlog.js";

const BacklogManagementToolSchema = BacklogOperationsSchema.refine(
	(data) => data.create || data.update || data.delete,
	"At least one of create, update, or delete operations must be provided",
);

export type BacklogManagementToolInput = z.infer<typeof BacklogManagementToolSchema>;

export async function handleBacklogManagementTool(
	input: BacklogManagementToolInput,
) {
	try {
		// Validate input using the full schema with refine validation
		const validatedInput = BacklogManagementToolSchema.parse(input);
		const { create, update, delete: deleteOps } = validatedInput;
		const results: string[] = [];

		const operationResult = await processBacklogOperations(validatedInput);
		
		if (operationResult.insertCount > 0) {
			results.push(`Successfully created ${operationResult.insertCount} backlog item${operationResult.insertCount === 1 ? "" : "s"}`);
		}
		
		if (operationResult.updateCount > 0) {
			results.push(`Successfully updated ${operationResult.updateCount} backlog item${operationResult.updateCount === 1 ? "" : "s"}`);
		}
		
		if (operationResult.deleteCount > 0) {
			results.push(`Successfully deleted ${operationResult.deleteCount} backlog item${operationResult.deleteCount === 1 ? "" : "s"}`);
		}

		if (results.length === 0) {
			results.push("No changes were made");
		}

		// Show summary of what items were affected if any
		const affectedItems: string[] = [];
		if (create) {
			affectedItems.push(...create.map(item => `Created: ${item.id} (${item.name})`));
		}
		if (update) {
			affectedItems.push(...Object.keys(update).map(id => `Updated: ${id}`));
		}
		if (deleteOps) {
			affectedItems.push(...deleteOps.map(id => `Deleted: ${id}`));
		}

		let responseText = results.join("; ");
		if (affectedItems.length > 0) {
			responseText += "\n\nAffected items:\n" + affectedItems.join("\n");
		}

		return {
			content: [
				{
					type: "text" as const,
					text: responseText,
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
				`Validation error: ${errorDetails}. Examples: ` +
					`For create: {"create": [{"id": "user-auth", "name": "User Authentication", "description": "Implement OAuth login", "effort": "L", "spec": "# Spec content"}]}. ` +
					`For update: {"update": {"user-auth": {"name": "Updated name", "spec": "# Updated spec content"}}}. ` +
					`For delete: {"delete": ["item-to-delete", "another-item"]}`,
			);
		}
		
		if (error instanceof Error && error.message.includes("does not exist")) {
			throw new McpError(
				ErrorCode.InvalidParams,
				error.message,
			);
		}
		
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to manage backlog items: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupBacklogManagementTool(server: McpServer): void {
	server.registerTool(
		"backlog_management",
		{
			title: "Backlog Management",
			description:
				"Create, update, or delete backlog items. Supports CRUD operations with optional specification files. At least one operation (create/update/delete) must be specified.",
			inputSchema: BacklogOperationsSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (args: BacklogManagementToolInput) => {
			return await handleBacklogManagementTool(args);
		},
	);
}