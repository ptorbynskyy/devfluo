// ABOUTME: Tool for updating knowledge base files (architecture.md and codebase.md)

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { config } from "../config.js";
import {
	type Decision,
	DecisionOperationsSchema,
	DecisionSchema,
	DecisionStoreSchema,
	type Decisions,
} from "../schemas/decision-schema.js";

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

async function processDecisionOperations(
	decisions: NonNullable<UpdateKnowledgeToolInput["decisions"]>,
): Promise<string> {
	const basePath = path.join(config.PROJECT_ROOT, "base");
	const decisionsPath = path.join(basePath, "decisions.json");

	// Load existing decisions
	let existingDecisions: Decisions = [];
	try {
		const decisionsContent = await readFile(decisionsPath, "utf-8");
		const parsedContent = JSON.parse(decisionsContent);
		const store = DecisionStoreSchema.parse(parsedContent);
		existingDecisions = store.decisions;
	} catch (_error) {
		// File doesn't exist or is invalid, start with empty array
		existingDecisions = [];
	}

	// Convert array to map for easier operations
	const decisionMap = new Map<string, Decision>();
	for (const decision of existingDecisions) {
		decisionMap.set(decision.name, decision);
	}

	let updateCount = 0;
	let insertCount = 0;
	let deleteCount = 0;

	// Process updates
	if (decisions.updates) {
		for (const [name, updates] of Object.entries(decisions.updates)) {
			const existingDecision = decisionMap.get(name);
			if (existingDecision) {
				// Update existing decision with merged properties
				const updatedDecision: Decision = {
					name: updates.name ?? existingDecision.name,
					description: updates.description ?? existingDecision.description,
					tags: updates.tags ?? existingDecision.tags,
				};
				decisionMap.set(name, updatedDecision);
				updateCount++;
			} else {
				const newData = DecisionSchema.parse(updates);
				// Create new decision if it has all required fields
				decisionMap.set(name, newData);
				insertCount++;
			}
		}
	}

	// Process deletions
	if (decisions.deletions) {
		for (const name of decisions.deletions) {
			if (decisionMap.delete(name)) {
				deleteCount++;
			}
		}
	}

	// Convert back to array and save
	const updatedDecisions = Array.from(decisionMap.values());
	const store = { decisions: updatedDecisions };
	await writeFile(decisionsPath, JSON.stringify(store, null, 2), "utf-8");

	return `Successfully processed, ${updateCount} decision updates, ${deleteCount} deletions, ${insertCount} insertions`;
}

export async function handleUpdateKnowledgeTool(
	input: UpdateKnowledgeToolInput,
) {
	try {
		// Validate input using the full schema with refine validation
		const validatedInput = UpdateKnowledgeToolZodSchema.parse(input);
		const { architecture_content, codebase_content, decisions } =
			validatedInput;
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

		if (decisions) {
			const decisionResult = await processDecisionOperations(decisions);
			results.push(decisionResult);
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
