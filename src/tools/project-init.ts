// ABOUTME: Project initialization tool that creates the base knowledge structure

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { config } from "../config.js";

export const ProjectInitToolSchema = {
	type: "object" as const,
	properties: {},
};

export const ProjectInitToolZodSchema = z.object({});

export type ProjectInitToolInput = z.infer<typeof ProjectInitToolZodSchema>;

export async function handleProjectInitTool(_input: ProjectInitToolInput) {
	const projectRoot = path.resolve(config.PROJECT_ROOT);
	const baseDir = path.join(projectRoot, "base");

	try {
		// Create base directory
		await mkdir(baseDir, { recursive: true });

		// Read template files
		const templatesDir = path.join(process.cwd(), "build", "templates");
		const architectureTemplate = await readFile(
			path.join(templatesDir, "architecture-template.md"),
			"utf-8",
		);
		const codebaseTemplate = await readFile(
			path.join(templatesDir, "codebase-template.md"),
			"utf-8",
		);

		// Write markdown files
		await writeFile(
			path.join(baseDir, "architecture.md"),
			architectureTemplate,
		);
		await writeFile(path.join(baseDir, "codebase.md"), codebaseTemplate);

		return {
			content: [
				{
					type: "text" as const,
					text: `Project initialized successfully!\n\nCreated:\n- ${baseDir}/architecture.md\n- ${baseDir}/codebase.md`,
				},
			],
		};
	} catch (error) {
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to initialize project: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function setupProjectInitTool(server: McpServer): void {
	server.registerTool(
		"project_init",
		{
			title: "Project Initialization Tool",
			description: "Initialize project knowledge base structure",
			inputSchema: ProjectInitToolZodSchema.shape,
		},
		async (args: ProjectInitToolInput) => {
			return await handleProjectInitTool(args);
		},
	);
}
