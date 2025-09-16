// ABOUTME: Tool for managing issues within initiatives with CRUD operations

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadInitiative } from "../domain/initiative/index.js";
import { IssueOperationsSchema } from "../domain/initiative/issue-schema.js";
import { processIssueOperations } from "../domain/initiative/issues.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

const IssueManagementToolBaseSchema = z.object({
	initiativeId: z
		.string()
		.min(1)
		.describe("The ID of the initiative to manage issues for"),
	...IssueOperationsSchema.shape,
});

const IssueManagementToolSchema = IssueManagementToolBaseSchema.refine(
	(data) => data.create || data.update || data.delete,
	"At least one of create, update, or delete operations must be provided",
);

export type IssueManagementToolInput = z.infer<
	typeof IssueManagementToolSchema
>;

export async function handleIssueManagementTool(
	input: IssueManagementToolInput,
) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

		// Validate input using the full schema with refine validation
		const validatedInput = IssueManagementToolSchema.parse(input);
		const { initiativeId, create, update, delete: deleteOps } = validatedInput;

		// Verify initiative exists
		const initiative = await loadInitiative(initiativeId);
		if (!initiative) {
			throw new Error(`Initiative '${initiativeId}' does not exist`);
		}

		const results: string[] = [];

		const operationResult = await processIssueOperations(initiativeId, {
			create,
			update,
			delete: deleteOps,
		});

		if (operationResult.insertCount > 0) {
			results.push(
				`Successfully created ${operationResult.insertCount} issue${operationResult.insertCount === 1 ? "" : "s"}`,
			);
		}

		if (operationResult.updateCount > 0) {
			results.push(
				`Successfully updated ${operationResult.updateCount} issue${operationResult.updateCount === 1 ? "" : "s"}`,
			);
		}

		if (operationResult.deleteCount > 0) {
			results.push(
				`Successfully deleted ${operationResult.deleteCount} issue${operationResult.deleteCount === 1 ? "" : "s"}`,
			);
		}

		if (results.length === 0) {
			results.push("No changes were made");
		}

		// Show summary of what items were affected if any
		const affectedItems: string[] = [];
		if (create) {
			affectedItems.push(
				...create.map((issue) => `Created: ${issue.id} (${issue.name})`),
			);
		}
		if (update) {
			affectedItems.push(...Object.keys(update).map((id) => `Updated: ${id}`));
		}
		if (deleteOps) {
			affectedItems.push(...deleteOps.map((id) => `Deleted: ${id}`));
		}

		let responseText = results.join("; ");
		if (affectedItems.length > 0) {
			responseText += `\n\nAffected issues:\n${affectedItems.join("\n")}`;
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
					`For create: {"initiativeId": "user-auth", "create": [{"id": "oauth-bug", "name": "OAuth redirect issue", "description": "Google OAuth redirects to wrong URL", "tags": ["oauth"], "status": "open", "actualStrategy": "embed", "summary": "Decided to embed fix directly in current sprint"}]}. ` +
					`For update: {"initiativeId": "user-auth", "update": {"oauth-bug": {"recommendedStrategy": "embed", "actualStrategy": "embed", "status": "closed", "summary": "Successfully embedded OAuth fix in authentication module"}}}. ` +
					`For delete: {"initiativeId": "user-auth", "delete": ["oauth-bug", "performance-issue"]}`,
			);
		}

		if (error instanceof Error && error.message.includes("does not exist")) {
			throw new McpError(ErrorCode.InvalidParams, error.message);
		}

		throw new McpError(
			ErrorCode.InternalError,
			`Failed to manage issues: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupIssueManagementTool(server: McpServer): void {
	server.registerTool(
		"issue_management",
		{
			title: "Issue Management",
			description:
				"Create, update, or delete issues within an initiative. Supports CRUD operations for tracking problems encountered during development.",
			inputSchema: IssueManagementToolBaseSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (args: IssueManagementToolInput) => {
			return await handleIssueManagementTool(args);
		},
	);
}
