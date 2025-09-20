// ABOUTME: Prompt for creating comprehensive specifications for backlog items

import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadBacklogItem, loadBacklogItems } from "../domain/backlog.js";
import {
	loadProjectContext,
	type ProjectContext,
} from "../templates/utils/project-context.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";
import { renderTemplateFile } from "../utils/template-engine.js";

export async function validateBacklogItemForSpec(backlogItemId: string) {
	const item = await loadBacklogItem(backlogItemId);

	if (!item) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Backlog item '${backlogItemId}' does not exist. Please create it first using the backlog_management tool.`,
		);
	}

	if (item.hasSpec) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Backlog item '${backlogItemId}' already has a specification. Use the backlog_management tool to update it if needed.`,
		);
	}

	return item;
}

export async function generateBacklogSpecificationPrompt(
	backlogItem: {
		id: string;
		name: string;
		description: string;
		effort?: string | undefined;
	},
	context: ProjectContext,
	comments?: string,
): Promise<string> {
	return await renderTemplateFile("backlog-specification.eta", {
		backlogItem,
		context,
		comments,
	});
}

export function setupBacklogSpecificationPrompt(server: McpServer): void {
	server.registerPrompt(
		"backlog_specification",
		{
			title: "create-backlog-item-specification",
			description:
				"Generate a comprehensive specification for a backlog item through guided brainstorming",
			argsSchema: {
				backlogItemId: completable(
					z
						.string()
						.regex(
							/^[a-z0-9-]+$/,
							"ID must contain only lowercase letters, numbers, and hyphens",
						)
						.min(1)
						.describe("ID of the backlog item to create a specification for"),
					async (backlogItemId): Promise<string[]> => {
						// Ensure the project is initialized
						await ensureProjectInitialized();

						const items = await loadBacklogItems();
						if (!backlogItemId) {
							return items.map((item) => item.id);
						}

						return items
							.map((item) => item.id)
							.filter((id) => id.startsWith(backlogItemId));
					},
				),
				comments: z.string().optional().describe("Additional comments"),
			},
		},
		async ({
			backlogItemId,
			comments,
		}: {
			backlogItemId: string;
			comments?: string | undefined;
		}) => {
			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				// Validate backlog item exists and doesn't already have a spec
				const backlogItem = await validateBacklogItemForSpec(backlogItemId);

				// Load project context with semantic enrichment
				const semanticQueries = [
					backlogItem.name,
					backlogItem.description,
				].filter(Boolean);
				const context = await loadProjectContext({ semanticQueries });

				// Generate the prompt
				const promptText = await generateBacklogSpecificationPrompt(
					backlogItem,
					context,
					comments,
				);

				return {
					messages: [
						{
							role: "user" as const,
							content: {
								type: "text" as const,
								text: promptText,
							},
						},
					],
				};
			} catch (error) {
				if (error instanceof McpError) {
					throw error;
				}
				throw new McpError(
					ErrorCode.InternalError,
					`Failed to create backlog specification prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
