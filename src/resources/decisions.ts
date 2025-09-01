// ABOUTME: Decisions resource that reads decision data from JSON file

import fs from "node:fs";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { config } from "../config.js";
import {
	DecisionStoreSchema,
	type Decisions,
} from "../domain/decision-schema.js";

export async function getDecisions(): Promise<Decisions> {
	const basePath = path.join(config.PROJECT_ROOT, "base");
	const decisionsPath = path.join(basePath, "decisions.json");

	try {
		const decisionsContent = await fs.promises.readFile(decisionsPath, "utf-8");
		const parsedContent = JSON.parse(decisionsContent);
		const store = DecisionStoreSchema.parse(parsedContent);

		// Validate the JSON structure using Zod schema
		return store.decisions;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new McpError(
				ErrorCode.InvalidRequest,
				"Invalid JSON format in decisions.json file",
			);
		}
		if (error instanceof z.ZodError) {
			throw new McpError(
				ErrorCode.InvalidRequest,
				`Invalid decision data structure: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
			);
		}
		// File not found or other read errors - return empty array
		return [];
	}
}

export function setupDecisionsResource(server: McpServer): void {
	server.registerResource(
		"decisions",
		"project://decisions",
		{
			title: "Project Decisions",
			description: "List of all project decisions from decisions.json file",
			mimeType: "application/json",
		},
		async (uri: URL) => {
			try {
				const decisions = await getDecisions();
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(decisions, null, 2),
						},
					],
				};
			} catch (_error) {
				throw new McpError(
					ErrorCode.InvalidRequest,
					`Failed to read decisions resource: ${uri.href}`,
				);
			}
		},
	);
}
