// ABOUTME: Example tool implementations for the MCP server

import { z } from "zod";

export const EchoToolSchema = z.object({
  text: z.string().describe("Text to echo back"),
});

export const CurrentTimeToolSchema = z.object({});

export type EchoToolInput = z.infer<typeof EchoToolSchema>;
export type CurrentTimeToolInput = z.infer<typeof CurrentTimeToolSchema>;

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