#!/usr/bin/env node

// ABOUTME: Main entry point for the MCP development workflow server

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ErrorCode,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	McpError,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
	handleProjectResource,
	PROJECT_RESOURCES,
} from "./resources/project.js";
import {
	CurrentTimeToolSchema,
	CurrentTimeToolZodSchema,
	EchoToolSchema,
	EchoToolZodSchema,
	handleCurrentTimeTool,
	handleEchoTool,
} from "./tools/example.js";

function setupResourceHandlers(server: Server): void {
	server.setRequestHandler(ListResourcesRequestSchema, async () => {
		return {
			resources: PROJECT_RESOURCES,
		};
	});

	server.setRequestHandler(
		ReadResourceRequestSchema,
		async (request) => {
			const { uri } = request.params;

			try {
				const resource = handleProjectResource(uri);
				return {
					contents: [resource],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Unknown resource: ${uri}`,
				);
			}
		},
	);
}

function setupToolHandlers(server: Server): void {
	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: "echo",
					description: "Echo back the provided text",
					inputSchema: EchoToolSchema,
				},
				{
					name: "current_time",
					description: "Get the current date and time",
					inputSchema: CurrentTimeToolSchema,
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;

		switch (name) {
			case "echo": {
				const parsed = EchoToolZodSchema.parse(args);
				return handleEchoTool(parsed);
			}

			case "current_time": {
				const parsed = CurrentTimeToolZodSchema.parse(args);
				return handleCurrentTimeTool(parsed);
			}

			default:
				throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
		}
	});
}

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
			},
		},
	);
}

async function runServer(): Promise<void> {
	const server = createServer();
	
	setupResourceHandlers(server);
	setupToolHandlers(server);
	
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

runServer().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
