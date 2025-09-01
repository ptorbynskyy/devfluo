// ABOUTME: Tool for updating knowledge base files (architecture.md and codebase.md)

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	saveArchitectureMarkDown,
	saveCodebaseMarkdown,
} from "../domain/base-knowledge.js";
import { DecisionOperationsSchema } from "../domain/decision-schema.js";
import { processDecisionOperations } from "../domain/decisions.js";

const UpdateKnowledgeToolBaseSchema = z.object({
	architecture_content: z
		.string()
		.optional()
		.describe("Content to replace the entire architecture.md file"),
	codebase_content: z
		.string()
		.optional()
		.describe("Content to replace the entire codebase.md file"),
	decisions: DecisionOperationsSchema.optional().describe(
		"Decision operations to update or delete decisions",
	),
});

export const UpdateKnowledgeToolZodSchema =
	UpdateKnowledgeToolBaseSchema.refine(
		(data) =>
			data.architecture_content || data.codebase_content || data.decisions,
		"At least one of architecture_content, codebase_content, or decisions must be provided",
	);

export type UpdateKnowledgeToolInput = z.infer<
	typeof UpdateKnowledgeToolZodSchema
>;

export async function handleUpdateKnowledgeTool(
	input: UpdateKnowledgeToolInput,
) {
	try {
		// Validate input using the full schema with refine validation
		const validatedInput = UpdateKnowledgeToolZodSchema.parse(input);
		const { architecture_content, codebase_content, decisions } =
			validatedInput;
		const results: string[] = [];

		if (architecture_content) {
			await saveArchitectureMarkDown(architecture_content);
			results.push(`Successfully updated architecture.md`);
		}

		if (codebase_content) {
			await saveCodebaseMarkdown(codebase_content);
			results.push(`Successfully updated codebase.md`);
		}

		if (decisions) {
			const decisionResult = await processDecisionOperations(decisions);
			results.push(
				`Successfully processed ${decisionResult.updateCount} decision updates, ${decisionResult.deleteCount} deletions, ${decisionResult.insertCount} insertions`,
			);
		}

		return {
			content: [
				{
					type: "text" as const,
					text: results.join("\n"),
				},
			],
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new McpError(
				ErrorCode.InvalidParams,
				`Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
			);
		}
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to update knowledge base files: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupUpdateKnowledgeTool(server: McpServer): void {
	server.registerTool(
		"update_knowledge",
		{
			title: "Update Knowledge Base",
			description:
				"Replace entire architecture.md and/or codebase.md files with new content, and update/delete decisions",
			inputSchema: UpdateKnowledgeToolBaseSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args: UpdateKnowledgeToolInput) => {
			return await handleUpdateKnowledgeTool(args);
		},
	);
}
