// ABOUTME: Prompt for creating comprehensive specifications for backlog items

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadBacklogItem } from "../domain/backlog.js";
import type { Decision } from "../domain/decision-schema.js";
import { loadDecisions } from "../domain/decisions.js";
import type { Pattern } from "../domain/pattern-schema.js";
import { loadPatterns } from "../domain/patterns.js";
import type { Solution } from "../domain/solution-schema.js";
import { loadSolutions } from "../domain/solutions.js";
import { getProjectKnowledge } from "../resources/knowledge.js";

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

export function generateBacklogSpecificationPrompt(
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
): string {
	const effortSection = backlogItem.effort
		? `**Effort Estimate:** ${backlogItem.effort}\n\n`
		: "";

	const decisionsSection =
		context.decisions.length > 0
			? `## Project Decisions\n${context.decisions.map((d) => `- **${d.name}**: ${d.description}`).join("\n")}\n\n`
			: "";

	const solutionsSection =
		context.solutions.length > 0
			? `## Project Solutions\n${context.solutions.map((s) => `- **${s.problem}**: ${s.solution}`).join("\n")}\n\n`
			: "";

	const patternsSection =
		context.patterns.length > 0
			? `## Project Patterns\n${context.patterns.map((p) => `- **${p.name}**: ${p.description}`).join("\n")}\n\n`
			: "";

	return `# Create Specification for Backlog Item: ${backlogItem.name}

You are helping create a detailed specification for the following backlog item:

**ID:** ${backlogItem.id}
**Name:** ${backlogItem.name}
**Description:** ${backlogItem.description}
${effortSection}

## Project Context

${context.knowledge}

${decisionsSection}${solutionsSection}${patternsSection}

## Your Task

Please conduct a comprehensive brainstorming session to create a detailed specification for this backlog item. Ask clarifying questions to gather all necessary information, then generate a complete specification document.

### Specification Structure

The final specification should be a markdown document with the following sections:

1. **Overview** - Brief summary of what this item accomplishes
2. **Requirements** - Detailed functional and non-functional requirements
3. **Acceptance Criteria** - Clear, testable criteria for completion
4. **Technical Considerations** - Architecture, dependencies, constraints
5. **Implementation Notes** - Specific guidance for developers
6. **Testing Strategy** - How this feature should be tested
7. **Documentation Needs** - What documentation should be updated

### Brainstorming Process

Start by asking relevant questions about:
- User needs and use cases
- Technical requirements and constraints
- Integration points with existing systems
- Performance and scalability considerations
- Security and compliance requirements
- User experience and interface requirements

Continue the conversation until you have enough information to create a comprehensive specification. When ready, generate the complete markdown specification and suggest using the backlog_management tool to save it:

\`\`\`json
{
  "update": {
    "${backlogItem.id}": {
      "spec": "[Generated specification content here]"
    }
  }
}
\`\`\`

Let's begin the brainstorming session for "${backlogItem.name}". What questions do you have about this backlog item?`;
}

export function setupBacklogSpecificationPrompt(server: McpServer): void {
	server.registerPrompt(
		"backlog_specification",
		{
			title: "Create Backlog Item Specification",
			description:
				"Generate a comprehensive specification for a backlog item through guided brainstorming",
			argsSchema: {
				backlogItemId: z
					.string()
					.regex(
						/^[a-z0-9-]+$/,
						"ID must contain only lowercase letters, numbers, and hyphens",
					)
					.min(1)
					.describe("ID of the backlog item to create a specification for"),
			},
		},
		async ({ backlogItemId }: { backlogItemId: string }) => {
			try {
				// Validate backlog item exists and doesn't already have a spec
				const backlogItem = await validateBacklogItemForSpec(backlogItemId);

				// Load all project context
				const context = await loadProjectContext();

				// Generate the prompt
				const promptText = generateBacklogSpecificationPrompt(
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
