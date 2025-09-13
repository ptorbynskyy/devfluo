// ABOUTME: Shared utility for initiative ID validation and completion to eliminate duplication across prompts

import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { z } from "zod";
import { getInitiativeIds } from "../../domain/initiative/index.js";

// Shared Zod schema for initiative ID validation
export const initiativeIdSchema = z
	.string()
	.regex(
		/^[a-z0-9-]+$/,
		"ID must contain only lowercase letters, numbers, and hyphens",
	)
	.min(1)
	.describe("ID of the initiative");

export type InitiativeId = z.infer<typeof initiativeIdSchema>;

// Factory function for creating completable initiative ID parameters
export function createCompletableInitiativeId(description?: string) {
	return completable(
		description ? initiativeIdSchema.describe(description) : initiativeIdSchema,
		async (initiativeId): Promise<string[]> => {
			const initiativeIds = await getInitiativeIds();
			if (!initiativeId) {
				return initiativeIds;
			}

			return initiativeIds.filter((id) => id.startsWith(initiativeId));
		},
	);
}
