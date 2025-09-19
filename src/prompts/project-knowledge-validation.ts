// ABOUTME: Prompt for comprehensive project knowledge validation and updating of existing knowledge base artifacts

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadProjectContext } from "../templates/utils/project-context.js";
import { ensureProjectInitialized } from "../utils/project-validation.js";
import { renderTemplateFile } from "../utils/template-engine.js";

// Zod schema for project knowledge validation input validation
export const ProjectKnowledgeValidationInputSchema = z.object({});

export type ProjectKnowledgeValidationInput = z.infer<
	typeof ProjectKnowledgeValidationInputSchema
>;

export async function generateProjectKnowledgeValidationPrompt(): Promise<string> {
	const projectContext = await loadProjectContext();
	return await renderTemplateFile("project-knowledge-validation.eta", {
		context: projectContext,
	});
}

export function setupProjectKnowledgeValidationPrompt(server: McpServer): void {
	server.registerPrompt(
		"project_knowledge_validation",
		{
			title: "validate-project-knowledge",
			description:
				"Validate and update existing project knowledge base artifacts (architecture, codebase documentation, decisions, solutions, patterns) against current codebase state. Ensures accuracy and relevance of all knowledge artifacts.",
			argsSchema: {},
		},
		async (_args: ProjectKnowledgeValidationInput) => {
			try {
				// Ensure project is initialized
				await ensureProjectInitialized();

				// Generate the prompt
				const promptText = await generateProjectKnowledgeValidationPrompt();

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
					`Failed to create project knowledge validation prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
	);
}
