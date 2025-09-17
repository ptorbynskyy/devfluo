#!/usr/bin/env node

// ABOUTME: Main entry point for the MCP development workflow server

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config.js";
import { setupBacklogSpecificationPrompt } from "./prompts/backlog-specification.js";
import { setupInitiativeCompletionPrompt } from "./prompts/initiative-completion.js";
import { setupInitiativeKnowledgeCollectionPrompt } from "./prompts/initiative-knowledge-collection.js";
import { setupInitiativePlanningPrompt } from "./prompts/initiative-planning.js";
import { setupInitiativeScopeChangePrompt } from "./prompts/initiative-scope-change.js";
import { setupInitiativeSpecificationPrompt } from "./prompts/initiative-specification.js";
import { setupInitiativeTaskExecutionPrompt } from "./prompts/initiative-task-execution.js";
import { setupIssueResolutionPrompt } from "./prompts/issue-resolution.js";
import { setupProjectInitializationPrompt } from "./prompts/project-initialization.js";
import { setupProjectKnowledgeValidationPrompt } from "./prompts/project-knowledge-validation.js";
import { setupBacklogResources } from "./resources/backlog.js";
import { setupDecisionsResource } from "./resources/decisions.js";
import { setupInitiativeResources } from "./resources/initiative.js";
import { setupProjectKnowledgeResource } from "./resources/knowledge.js";
import { setupMemoryCardsResources } from "./resources/memory-cards.js";
import { setupPatternsResource } from "./resources/patterns.js";
import { setupSolutionsResource } from "./resources/solutions.js";
import { setupBacklogManagementTool } from "./tools/backlog-management.js";
import { setupInitiativeCreateTool } from "./tools/initiative-create.js";
import { setupInitiativeDeleteTool } from "./tools/initiative-delete.js";
import { setupInitiativeUpdateTool } from "./tools/initiative-update.js";
import { setupIssueManagementTool } from "./tools/issue-management.js";
import { setupMemoryCardAddOrUpdateTool } from "./tools/memory-card-add-or-update.js";
import { setupMemoryCardRemoveTool } from "./tools/memory-card-remove.js";
import { setupMemoryCardSearchTool } from "./tools/memory-card-search.js";
import { setupProjectInitTool } from "./tools/project-init.js";
import { setupUpdateKnowledgeTool } from "./tools/update-knowledge.js";
import { VERSION } from "./version.js";

function createServer(): McpServer {
	return new McpServer(
		{
			name: "devfluo",
			version: VERSION,
		},
		{
			capabilities: {
				completions: {},
				resources: {},
				tools: {},
				prompts: {},
			},
		},
	);
}

async function runServer(): Promise<void> {
	// Initialize configuration
	console.error(`Using PROJECT_ROOT: ${config.PROJECT_ROOT}`);

	const server = createServer();

	setupProjectKnowledgeResource(server);
	setupDecisionsResource(server);
	setupPatternsResource(server);
	setupSolutionsResource(server);
	setupBacklogResources(server);
	setupInitiativeResources(server);
	setupMemoryCardsResources(server);
	setupProjectInitTool(server);
	setupUpdateKnowledgeTool(server);
	setupBacklogManagementTool(server);
	setupInitiativeCreateTool(server);
	setupInitiativeUpdateTool(server);
	setupInitiativeDeleteTool(server);
	setupIssueManagementTool(server);
	setupMemoryCardAddOrUpdateTool(server);
	setupMemoryCardRemoveTool(server);
	setupMemoryCardSearchTool(server);
	setupBacklogSpecificationPrompt(server);
	setupInitiativeSpecificationPrompt(server);
	setupInitiativePlanningPrompt(server);
	setupInitiativeTaskExecutionPrompt(server);
	setupInitiativeKnowledgeCollectionPrompt(server);
	setupInitiativeScopeChangePrompt(server);
	setupIssueResolutionPrompt(server);
	setupInitiativeCompletionPrompt(server);
	setupProjectInitializationPrompt(server);
	setupProjectKnowledgeValidationPrompt(server);

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

runServer().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
