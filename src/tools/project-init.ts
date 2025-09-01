// ABOUTME: Project initialization tool that creates the base knowledge structure

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { init, isInitialized } from "../domain/base-knowledge.js";

export const ProjectInitToolSchema = {
	type: "object" as const,
	properties: {},
};

export const ProjectInitToolZodSchema = z.object({});

export type ProjectInitToolInput = z.infer<typeof ProjectInitToolZodSchema>;

export async function handleProjectInitTool(_input: ProjectInitToolInput) {
	try {
		const result = await isInitialized();
		if (result) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Project is already initialized: ${result}`,
					},
				],
			};
		}

		const { root } = await init();
		return {
			content: [
				{
					type: "text" as const,
					text: `Project initialized successfully at ${root}`,
				},
			],
		};
	} catch (error) {
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to initialize project: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupProjectInitTool(server: McpServer): void {
	server.registerTool(
		"project_init",
		{
			title: "Project Initialization Tool",
			description: "Initialize project knowledge base structure",
			inputSchema: ProjectInitToolZodSchema.shape,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (args: ProjectInitToolInput) => {
			return await handleProjectInitTool(args);
		},
	);
}
