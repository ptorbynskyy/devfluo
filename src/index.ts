#!/usr/bin/env node

// ABOUTME: Main entry point for the MCP development workflow server

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config.js";
import {
	setupBugReportPrompt,
	setupCodeReviewPrompt,
} from "./prompts/development.js";
import { setupBacklogResources } from "./resources/backlog.js";
import { setupDecisionsResource } from "./resources/decisions.js";
import { setupInitiativeResources } from "./resources/initiative.js";
import { setupProjectKnowledgeResource } from "./resources/knowledge.js";
import { setupPatternsResource } from "./resources/patterns.js";
import { setupSolutionsResource } from "./resources/solutions.js";
import { setupBacklogManagementTool } from "./tools/backlog-management.js";
import { setupInitiativeCreateTool } from "./tools/initiative-create.js";
import { setupInitiativeDeleteTool } from "./tools/initiative-delete.js";
import { setupInitiativeUpdateTool } from "./tools/initiative-update.js";
import { setupProjectInitTool } from "./tools/project-init.js";
import { setupUpdateKnowledgeTool } from "./tools/update-knowledge.js";

function createServer(): McpServer {
	return new McpServer(
		{
			name: "dev-flow-mcp",
			version: "0.1.0",
		},
		{
			capabilities: {
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
	setupProjectInitTool(server);
	setupUpdateKnowledgeTool(server);
	setupBacklogManagementTool(server);
	setupInitiativeCreateTool(server);
	setupInitiativeUpdateTool(server);
	setupInitiativeDeleteTool(server);
	setupCodeReviewPrompt(server);
	setupBugReportPrompt(server);

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

runServer().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
