// ABOUTME: Prompt for comprehensive project initialization including knowledge base setup and codebase analysis

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { renderTemplateFile } from "../utils/template-engine.js";

// Zod schema for project initialization input validation
export const ProjectInitializationInputSchema = z.object({});

export type ProjectInitializationInput = z.infer<
	typeof ProjectInitializationInputSchema
>;

export async function generateProjectInitializationPrompt(): Promise<string> {
	return await renderTemplateFile("project-initialization.eta", {});
}

export function setupProjectInitializationPrompt(server: McpServer): void {
	server.registerPrompt(
		"project_initialization",
		{
			title: "initialize-project",
			description:
				"Initialize project with comprehensive codebase analysis and knowledge base setup. Creates architecture and codebase documentation.",
			argsSchema: {},
		},
		async (_args: ProjectInitializationInput) => {
			try {
				// Generate the prompt
				const promptText = await generateProjectInitializationPrompt();

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
				throw new McpError(
					ErrorCode.InternalError,
					`Failed to create project initialization prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
