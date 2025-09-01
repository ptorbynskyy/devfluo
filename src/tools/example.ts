// ABOUTME: Example tool implementations for the MCP server

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const EchoToolSchema = {
	type: "object" as const,
	properties: {
		text: {
			type: "string" as const,
			description: "Text to echo back",
		},
	},
	required: ["text"],
};

export const CurrentTimeToolSchema = {
	type: "object" as const,
	properties: {},
};

export const EchoToolZodSchema = z.object({
	text: z.string(),
});

export const CurrentTimeToolZodSchema = z.object({});

export type EchoToolInput = z.infer<typeof EchoToolZodSchema>;
export type CurrentTimeToolInput = z.infer<typeof CurrentTimeToolZodSchema>;

export function handleEchoTool(input: EchoToolInput) {
	return {
		content: [
			{
				type: "text" as const,
				text: `Echo: ${input.text}`,
			},
		],
	};
}

export function handleCurrentTimeTool(_input: CurrentTimeToolInput) {
	return {
		content: [
			{
				type: "text" as const,
				text: `Current time: ${new Date().toISOString()}`,
			},
		],
	};
}

export function setupEchoTool(server: Server): void {
	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: "echo",
					description: "Echo back the provided text",
					inputSchema: EchoToolSchema,
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;

		if (name === "echo") {
			const parsed = EchoToolZodSchema.parse(args);
			return handleEchoTool(parsed);
		}

		throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
	});
}

export function setupCurrentTimeTool(server: Server): void {
	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
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

		if (name === "current_time") {
			const parsed = CurrentTimeToolZodSchema.parse(args);
			return handleCurrentTimeTool(parsed);
		}

		throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
	});
}
