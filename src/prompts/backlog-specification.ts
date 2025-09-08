// ABOUTME: Prompt for creating comprehensive specifications for backlog items

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadBacklogItem, loadBacklogItems } from "../domain/backlog.js";
import type { Decision } from "../domain/decision-schema.js";
import { loadDecisions } from "../domain/decisions.js";
import type { Pattern } from "../domain/pattern-schema.js";
import { loadPatterns } from "../domain/patterns.js";
import type { Solution } from "../domain/solution-schema.js";
import { loadSolutions } from "../domain/solutions.js";
import { getProjectKnowledge } from "../resources/knowledge.js";
import { renderTemplateFile } from "../utils/template-engine.js";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";

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

export async function loadProjectContext() {
	const [knowledge, decisions, solutions, patterns] = await Promise.all([
		getProjectKnowledge(),
		loadDecisions(),
		loadSolutions(),
		loadPatterns(),
	]);

	return {
		knowledge,
		decisions,
		solutions,
		patterns,
	};
}

export async function generateBacklogSpecificationPrompt(
	backlogItem: {
		id: string;
		name: string;
		description: string;
		effort?: string | undefined;
	},
	context: {
		knowledge: string;
		decisions: Decision[];
		solutions: Solution[];
		patterns: Pattern[];
	},
): Promise<string> {
	return await renderTemplateFile("backlog-specification.eta", {
		backlogItem,
		context,
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
						const items = await loadBacklogItems();
						if (!backlogItemId) {
							return items.map((item) => item.id);
						}

						const existingIds = items
							.map((item) => item.id)
							.filter((id) => id.startsWith(backlogItemId));
						return existingIds;
					},
				),
			},
		},
		async ({ backlogItemId }: { backlogItemId: string }) => {
			try {
				// Validate backlog item exists and doesn't already have a spec
				const backlogItem = await validateBacklogItemForSpec(backlogItemId);

				// Load all project context
				const context = await loadProjectContext();

				// Generate the prompt
				const promptText = await generateBacklogSpecificationPrompt(
					backlogItem,
					context,
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
