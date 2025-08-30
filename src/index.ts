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
import { z } from "zod";

class DevFlowMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "dev-flow-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "project://info",
            mimeType: "text/plain",
            name: "Project Information",
            description: "General information about the current project",
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case "project://info":
          return {
            contents: [
              {
                uri,
                mimeType: "text/plain",
                text: "This is a Model Context Protocol server for development workflow assistance.",
              },
            ],
          };
        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      }
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "echo",
            description: "Echo back the provided text",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "Text to echo back",
                },
              },
              required: ["text"],
            },
          },
          {
            name: "current_time",
            description: "Get the current date and time",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "echo": {
          const parsed = z.object({ text: z.string() }).parse(args);
          return {
            content: [
              {
                type: "text",
                text: `Echo: ${parsed.text}`,
              },
            ],
          };
        }

        case "current_time": {
          return {
            content: [
              {
                type: "text",
                text: `Current time: ${new Date().toISOString()}`,
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new DevFlowMCPServer();
server.run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});