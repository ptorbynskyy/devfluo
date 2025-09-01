// ABOUTME: Project resource handlers for the MCP server

import fs from "node:fs";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
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
	{
		uri: "project://knowledge",
		name: "Project Knowledge",
		description: "Architecture and codebase knowledge from mcdown files",
		mimeType: "text/markdown",
	},
];

export function getProjectInfo(): string {
	return `Project root: ${path.resolve(config.PROJECT_ROOT)}`;
}

export function getProjectKnowledge(): string {
	const basePath = path.join(config.PROJECT_ROOT, "base");
	const architecturePath = path.join(basePath, "architecture.md");
	const codebasePath = path.join(basePath, "codebase.md");

	let content = "";

	try {
		const architectureContent = fs.readFileSync(architecturePath, "utf-8");
		content += "# Architecture Knowledge\n\n";
		content += architectureContent;
		content += "\n\n";
	} catch (_error) {
		content += "# Architecture Knowledge\n\n";
		content += "Architecture file not found or could not be read.\n\n";
	}

	try {
		const codebaseContent = fs.readFileSync(codebasePath, "utf-8");
		content += "# Codebase Knowledge\n\n";
		content += codebaseContent;
	} catch (_error) {
		content += "# Codebase Knowledge\n\n";
		content += "Codebase file not found or could not be read.";
	}

	return content;
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
		case "project://knowledge":
			return {
				uri,
				mimeType: "text/markdown",
				text: getProjectKnowledge(),
			};
		default:
			throw new Error(`Unknown project resource: ${uri}`);
	}
}

export function setupProjectInfoResource(server: McpServer): void {
	server.registerResource(
		"project_info",
		"project://info",
		{
			title: "Project Information",
			description: "General information about the current project",
			mimeType: "text/plain",
		},
		async (uri: URL) => {
			try {
				const resource = handleProjectResource(uri.href);
				return {
					contents: [
						{
							uri: resource.uri,
							mimeType: resource.mimeType,
							text: resource.text,
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Unknown resource: ${uri.href}`,
				);
			}
		},
	);
}

export function setupProjectKnowledgeResource(server: McpServer): void {
	server.registerResource(
		"project_knowledge",
		"project://knowledge",
		{
			title: "Project Knowledge",
			description: "Architecture and codebase knowledge from mcdown files",
			mimeType: "text/markdown",
		},
		async (uri: URL) => {
			try {
				const resource = handleProjectResource(uri.href);
				return {
					contents: [
						{
							uri: resource.uri,
							mimeType: resource.mimeType,
							text: resource.text,
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Unknown resource: ${uri.href}`,
				);
			}
		},
	);
}
