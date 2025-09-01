// ABOUTME: Example tool implementations for the MCP server

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
