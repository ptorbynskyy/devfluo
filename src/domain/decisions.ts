import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { baseKnowledgePath } from "./base-knowledge.js";
import {
	type Decision,
	type DecisionOperations,
	DecisionSchema,
	DecisionStoreSchema,
	type Decisions,
} from "./decision-schema.js";

export const decisionsPath = path.join(baseKnowledgePath, "decisions.json");

export async function loadDecisions(): Promise<Decisions> {
	let decisionsContent: string;
	try {
		decisionsContent = await readFile(decisionsPath, "utf-8");
	} catch (_error) {
		// File doesn't exist
		return [];
	}

	return DecisionStoreSchema.parse(JSON.parse(decisionsContent)).decisions;
}

export async function saveDecisions(decisions: Decisions): Promise<void> {
	await writeFile(
		decisionsPath,
		JSON.stringify({ decisions }, null, 2),
		"utf-8",
	);
}

export async function processDecisionOperations(
	decisions: DecisionOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	// Load existing decisions
	const existingDecisions: Decisions = await loadDecisions();

	// Convert array to map for easier operations
	const decisionMap = new Map<string, Decision>();
	for (const decision of existingDecisions) {
		decisionMap.set(decision.name, decision);
	}

	let updateCount = 0;
	let insertCount = 0;
	let deleteCount = 0;

	// Process updates
	if (decisions.updates) {
		for (const [name, updates] of Object.entries(decisions.updates)) {
			const existingDecision = decisionMap.get(name);
			if (existingDecision) {
				// Update existing decision with merged properties
				const updatedDecision: Decision = {
					name: updates.name ?? existingDecision.name,
					description: updates.description ?? existingDecision.description,
					tags: updates.tags ?? existingDecision.tags,
				};
				decisionMap.set(name, updatedDecision);
				updateCount++;
			} else {
				const newData = DecisionSchema.parse(updates);
				// Create new decision if it has all required fields
				decisionMap.set(name, newData);
				insertCount++;
			}
		}
	}

	// Process deletions
	if (decisions.deletions) {
		for (const name of decisions.deletions) {
			if (decisionMap.delete(name)) {
				deleteCount++;
			}
		}
	}

	// Convert back to array and save
	await saveDecisions(Array.from(decisionMap.values()));

	return {
		updateCount,
		insertCount,
		deleteCount,
	};
}
