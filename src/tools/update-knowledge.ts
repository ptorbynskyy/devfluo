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
import { PatternOperationsSchema } from "../domain/pattern-schema.js";
import { processPatternOperations } from "../domain/patterns.js";
import { SolutionOperationsSchema } from "../domain/solution-schema.js";
import { processSolutionOperations } from "../domain/solutions.js";

const UpdateKnowledgeToolBaseSchema = z.object({
	architectureContent: z
		.string()
		.optional()
		.describe("Content to replace the entire architecture.md file"),
	codebaseContent: z
		.string()
		.optional()
		.describe("Content to replace the entire codebase.md file"),
	decisions: DecisionOperationsSchema.optional().describe(
		"Decision operations to update or delete decisions",
	),
	patterns: PatternOperationsSchema.optional().describe(
		"Pattern operations to update or delete patterns",
	),
	solutions: SolutionOperationsSchema.optional().describe(
		"Solution operations to update or delete solutions",
	),
});

export const UpdateKnowledgeToolZodSchema =
	UpdateKnowledgeToolBaseSchema.refine(
		(data) =>
			data.architectureContent ||
			data.codebaseContent ||
			data.decisions ||
			data.patterns ||
			data.solutions,
		"At least one of architectureContent, codebaseContent, decisions, patterns, or solutions must be provided",
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
		const { architectureContent, codebaseContent, decisions, patterns, solutions } =
			validatedInput;
		const results: string[] = [];

		if (architectureContent) {
			await saveArchitectureMarkDown(architectureContent);
			results.push(`Successfully updated architecture.md`);
		}

		if (codebaseContent) {
			await saveCodebaseMarkdown(codebaseContent);
			results.push(`Successfully updated codebase.md`);
		}

		if (decisions) {
			const decisionResult = await processDecisionOperations(decisions);
			results.push(
				`Successfully processed ${decisionResult.insertCount} decision creations, ${decisionResult.updateCount} updates, ${decisionResult.deleteCount} deletions`,
			);
		}

		if (patterns) {
			const patternResult = await processPatternOperations(patterns);
			results.push(
				`Successfully processed ${patternResult.insertCount} pattern creations, ${patternResult.updateCount} updates, ${patternResult.deleteCount} deletions`,
			);
		}

		if (solutions) {
			const solutionResult = await processSolutionOperations(solutions);
			results.push(
				`Successfully processed ${solutionResult.insertCount} solution creations, ${solutionResult.updateCount} updates, ${solutionResult.deleteCount} deletions`,
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
			const errorDetails = error.errors
				.map((e) => {
					const path = e.path.length > 0 ? ` at '${e.path.join(".")}'` : "";
					return `${e.message}${path}`;
				})
				.join(", ");

			throw new McpError(
				ErrorCode.InvalidParams,
				`Validation error: ${errorDetails}. Examples: ` +
					`For decisions: {"create": [{"name": "decision-name", "description": "Description", "tags": ["tag1"]}], ` +
					`"update": {"existing-name": {"description": "New description"}}, ` +
					`"delete": ["name-to-delete"]}. ` +
					`For patterns: {"create": [{"name": "pattern-name", "description": "Description", "tags": ["tag1"], "snippetFilename": "example.ts", "codeReferences": ["src/file.ts:10-20"]}], ` +
					`"update": {"existing-pattern": {"description": "New description"}}, ` +
					`"delete": ["pattern-to-delete"]}. ` +
					`For solutions: {"create": [{"problem": "Memory leaks", "solution": "Use cleanup functions", "tags": ["react"], "codeReferences": ["src/hooks/useApi.ts:45"]}], ` +
					`"update": {"memory-leak-fix": {"solution": "Updated solution"}}, ` +
					`"delete": ["old-solution"]}`,
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
				"Replace entire architecture.md and/or codebase.md files with new content, and perform decision/pattern/solution operations (create/update/delete). At least one operation must be specified.",
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
