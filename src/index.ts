#!/usr/bin/env node

// ABOUTME: Main entry point for the MCP development workflow server

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	setupBugReportPrompt,
	setupCodeReviewPrompt,
} from "./prompts/development.js";
import { setupProjectInfoResource } from "./resources/project.js";
import { setupCurrentTimeTool, setupEchoTool } from "./tools/example.js";

function createServer(): Server {
	return new Server(
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
	const server = createServer();

	setupProjectInfoResource(server);
	setupEchoTool(server);
	setupCurrentTimeTool(server);
	setupCodeReviewPrompt(server);
	setupBugReportPrompt(server);

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

runServer().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
