// ABOUTME: Project knowledge resource that reads Architecture and Codebase mcdown files

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
	getArchitectureKnowledge,
	getCodebaseKnowledge,
} from "../domain/base-knowledge.js";

export async function getProjectKnowledge(): Promise<string> {
	const architectureContent = (await getArchitectureKnowledge()) ?? "";
	const codebaseContent = (await getCodebaseKnowledge()) ?? "";

	let content = "# Architecture Knowledge\n\n";
	content += architectureContent;
	content += "\n\n";
	content += "# Codebase Knowledge\n\n";
	content += codebaseContent;

	return content;
}

export function setupProjectKnowledgeResource(server: McpServer): void {
	// Combined knowledge resource
	server.registerResource(
		"project_knowledge",
		"project://knowledge",
		{
			title: "Project Knowledge",
			description:
				"Combined architecture and codebase knowledge from mcdown files",
			mimeType: "text/markdown",
		},
		async (uri: URL) => {
			try {
				const knowledge = await getProjectKnowledge();
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/markdown",
							text: knowledge,
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read combined knowledge resource: ${uri.href}`,
				);
			}
		},
	);

	// Architecture knowledge resource
	server.registerResource(
		"architecture_knowledge",
		"project://knowledge/architecture",
		{
			title: "Project Architecture Knowledge",
			description: "Architecture knowledge from architecture.md file",
			mimeType: "text/markdown",
		},
		async (uri: URL) => {
			try {
				const architectureContent = (await getArchitectureKnowledge()) ?? "";
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/markdown",
							text: architectureContent,
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read architecture knowledge resource: ${uri.href}`,
				);
			}
		},
	);

	// Codebase knowledge resource
	server.registerResource(
		"codebase_knowledge",
		"project://knowledge/codebase",
		{
			title: "Project Codebase Knowledge",
			description: "Codebase knowledge from codebase.md file",
			mimeType: "text/markdown",
		},
		async (uri: URL) => {
			try {
				const codebaseContent = (await getCodebaseKnowledge()) ?? "";
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/markdown",
							text: codebaseContent,
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read codebase knowledge resource: ${uri.href}`,
				);
			}
		},
	);
}
