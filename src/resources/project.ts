// ABOUTME: Project resource handlers for the MCP server

import path from "node:path";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	ErrorCode,
	ListResourcesRequestSchema,
	McpError,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "../config.js";

export interface ProjectResource {
	uri: string;
	name: string;
	description: string;
	mimeType: string;
}

export const PROJECT_RESOURCES: ProjectResource[] = [
	{
		uri: "project://info",
		name: "Project Information",
		description: "General information about the current project",
		mimeType: "text/plain",
	},
];

export function getProjectInfo(): string {
	return `Project root: ${path.resolve(config.PROJECT_ROOT)}`;
}

export function handleProjectResource(uri: string): {
	uri: string;
	mimeType: string;
	text: string;
} {
	switch (uri) {
		case "project://info":
			return {
				uri,
				mimeType: "text/plain",
				text: getProjectInfo(),
			};
		default:
			throw new Error(`Unknown project resource: ${uri}`);
	}
}

export function setupProjectInfoResource(server: Server): void {
	server.setRequestHandler(ListResourcesRequestSchema, async () => {
		return {
			resources: PROJECT_RESOURCES,
		};
	});

	server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
		const { uri } = request.params;

		try {
			const resource = handleProjectResource(uri);
			return {
				contents: [resource],
			};
		} catch (_error) {
			throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
		}
	});
}
