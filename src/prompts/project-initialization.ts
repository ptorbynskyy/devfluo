// ABOUTME: Prompt for comprehensive project initialization including knowledge base setup and codebase analysis

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ensureProjectNotInitialized } from "../utils/project-validation.js";
import { renderTemplateFile } from "../utils/template-engine.js"; // Zod schema for project initialization input validation

// Zod schema for project initialization input validation
export const ProjectInitializationInputSchema = z.object({
	comments: z.string().optional().describe("Additional comments"),
});

export async function generateProjectInitializationPrompt(
	comments: string | undefined,
): Promise<string> {
	return await renderTemplateFile("project-initialization.eta", {
		comments,
	});
}

export function setupProjectInitializationPrompt(server: McpServer): void {
	server.registerPrompt(
		"project_initialization",
		{
			title: "initialize-project",
			description:
				"Initialize project with comprehensive codebase analysis and knowledge base setup. Creates architecture and codebase documentation.",
			argsSchema: ProjectInitializationInputSchema.shape,
		},
		async ({ comments }) => {
			try {
				// Ensure project is not already initialized
				await ensureProjectNotInitialized();

				// Generate the prompt
				const promptText = await generateProjectInitializationPrompt(comments);

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
