// ABOUTME: Shared project initialization validation utilities for MCP tools, resources, and prompts

import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { isInitialized } from "../domain/base-knowledge.js";

/**
 * Ensures project is initialized, throws McpError if not
 * Used by all tools, resources, and prompts except Project Init components
 */
export async function ensureProjectInitialized(): Promise<void> {
	const initialized = await isInitialized();
	if (!initialized) {
		throw new McpError(
			ErrorCode.InvalidRequest,
			"Project not initialized. Please use the 'initialize-project' prompt first.",
		);
	}
}

/**
 * Ensures project is NOT initialized, throws McpError if already initialized
 * Used by Project Initialization Prompt only
 */
export async function ensureProjectNotInitialized(): Promise<void> {
	const initialized = await isInitialized();
	if (initialized) {
		throw new McpError(ErrorCode.InvalidRequest, "Project already initialized");
	}
}
