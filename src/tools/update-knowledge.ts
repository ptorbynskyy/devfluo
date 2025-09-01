// ABOUTME: Tool for updating knowledge base files (architecture.md and codebase.md)

import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { config } from "../config.js";

const UpdateKnowledgeToolBaseSchema = z.object({
	architecture_content: z
		.string()
		.optional()
		.describe("Content to replace the entire architecture.md file"),
	codebase_content: z
		.string()
		.optional()
		.describe("Content to replace the entire codebase.md file"),
});

export const UpdateKnowledgeToolZodSchema =
	UpdateKnowledgeToolBaseSchema.refine(
		(data) => data.architecture_content || data.codebase_content,
		"At least one of architecture_content or codebase_content must be provided",
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
		const { architecture_content, codebase_content } = validatedInput;
		const basePath = path.join(config.PROJECT_ROOT, "base");
		const results: string[] = [];

		if (architecture_content) {
			const architectureFilePath = path.join(basePath, "architecture.md");
			await writeFile(architectureFilePath, architecture_content, "utf-8");
			results.push(`Successfully updated architecture.md`);
		}

		if (codebase_content) {
			const codebaseFilePath = path.join(basePath, "codebase.md");
			await writeFile(codebaseFilePath, codebase_content, "utf-8");
			results.push(`Successfully updated codebase.md`);
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
				`Validation error: ${error.errors.map(e => e.message).join(", ")}`,
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
				"Replace entire architecture.md and/or codebase.md files with new content",
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
