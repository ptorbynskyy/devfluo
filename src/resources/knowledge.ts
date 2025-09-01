// ABOUTME: Project knowledge resource that reads Architecture and Codebase mcdown files

import fs from "node:fs";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { config } from "../config.js";

export async function getProjectKnowledge(): Promise<string> {
	const basePath = path.join(config.PROJECT_ROOT, "base");
	const architecturePath = path.join(basePath, "architecture.md");
	const codebasePath = path.join(basePath, "codebase.md");

	let content = "";

	try {
		const architectureContent = await fs.promises.readFile(
			architecturePath,
			"utf-8",
		);
		content += "# Architecture Knowledge\n\n";
		content += architectureContent;
		content += "\n\n";
	} catch (_error) {
		content += "# Architecture Knowledge\n\n";
		content += "Architecture file not found or could not be read.\n\n";
	}

	try {
		const codebaseContent = await fs.promises.readFile(codebasePath, "utf-8");
		content += "# Codebase Knowledge\n\n";
		content += codebaseContent;
	} catch (_error) {
		content += "# Codebase Knowledge\n\n";
		content += "Codebase file not found or could not be read.";
	}

	return content;
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
					`Failed to read knowledge resource: ${uri.href}`,
				);
			}
		},
	);
}
