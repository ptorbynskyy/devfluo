// ABOUTME: Tool for updating knowledge base files (architecture.md and codebase.md)

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	saveArchitectureMarkDown,
	saveCodebaseMarkdown,
} from "../domain/base-knowledge.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";

const UpdateKnowledgeToolBaseSchema = z.object({
	architectureContent: z
		.string()
		.optional()
		.describe("Content to replace the entire architecture documents"),
	codebaseContent: z
		.string()
		.optional()
		.describe("Content to replace the entire codebase documents"),
});

export const UpdateKnowledgeToolZodSchema =
	UpdateKnowledgeToolBaseSchema.refine(
		(data) =>
			data.architectureContent ||
			data.codebaseContent ||
			"At least one of architectureContent, codebaseContent must be provided",
	);

export type UpdateKnowledgeToolInput = z.infer<
	typeof UpdateKnowledgeToolZodSchema
>;

export async function handleUpdateKnowledgeTool(
	input: UpdateKnowledgeToolInput,
) {
	try {
		// Ensure project is initialized
		await ensureProjectInitialized();

		// Validate input using the full schema with refine validation
		const validatedInput = UpdateKnowledgeToolZodSchema.parse(input);
		const { architectureContent, codebaseContent } = validatedInput;
		const results: string[] = [];

		if (architectureContent) {
			await saveArchitectureMarkDown(architectureContent);
			results.push(`Successfully updated architecture document`);
		}

		if (codebaseContent) {
			await saveCodebaseMarkdown(codebaseContent);
			results.push(`Successfully updated codebase document`);
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
			const errorDetails = error.errors
				.map((e) => {
					const path = e.path.length > 0 ? ` at '${e.path.join(".")}'` : "";
					return `${e.message}${path}`;
				})
				.join(", ");

			throw new McpError(
				ErrorCode.InvalidParams,
				`Validation error: ${errorDetails}`,
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
			title: "Update Project Knowledge Base",
			description:
				"Replace entire architecture and/or codebase documents with new content",
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
