import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { baseKnowledgePath } from "./base-knowledge.js";
import {
	type Decision,
	type DecisionOperations,
	DecisionSchema,
	DecisionStoreSchema,
	type Decisions,
} from "./decision-schema.js";

export const decisionsPath = path.join(baseKnowledgePath, "decisions");
export const decisionsJsonPath = path.join(decisionsPath, "decisions.json");

async function loadDecisionsFromPaths(jsonPath: string): Promise<Decisions> {
	let decisionsContent: string;
	try {
		decisionsContent = await readFile(jsonPath, "utf-8");
	} catch (_error) {
		// File doesn't exist
		return [];
	}

	return DecisionStoreSchema.parse(JSON.parse(decisionsContent)).decisions;
}

export async function loadDecisions(): Promise<Decisions> {
	return loadDecisionsFromPaths(decisionsJsonPath);
}

async function saveDecisionsWithPaths(
	decisionMap: Map<string, Decision>,
	basePath: string,
	jsonPath: string,
): Promise<void> {
	await mkdir(basePath, { recursive: true });
	await writeFile(
		jsonPath,
		JSON.stringify({ decisions: Array.from(decisionMap.values()) }, null, 2),
		"utf-8",
	);
}

export async function saveDecisions(
	decisionMap: Map<string, Decision>,
): Promise<void> {
	return saveDecisionsWithPaths(decisionMap, decisionsPath, decisionsJsonPath);
}

export async function processDecisionOperationsWithPaths(
	decisions: DecisionOperations,
	basePath: string,
	jsonPath: string,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	// Load existing decisions
	const existingDecisions: Decisions = await loadDecisionsFromPaths(jsonPath);

	// Convert array to map for easier operations
	const decisionMap = new Map<string, Decision>();
	for (const decision of existingDecisions) {
		decisionMap.set(decision.name, decision);
	}

	let updateCount = 0;
	let insertCount = 0;
	let deleteCount = 0;

	// Process creates - new decisions with complete data
	if (decisions.create) {
		for (const newDecision of decisions.create) {
			// Validate that the decision has all required fields
			const validatedDecision = DecisionSchema.parse(newDecision);

			if (decisionMap.has(validatedDecision.name)) {
				// If decision already exists, treat as update
				decisionMap.set(validatedDecision.name, validatedDecision);
				updateCount++;
			} else {
				// Create new decision
				decisionMap.set(validatedDecision.name, validatedDecision);
				insertCount++;
			}
		}
	}

	// Process updates - partial updates to existing decisions
	if (decisions.update) {
		for (const [name, updates] of Object.entries(decisions.update)) {
			const existingDecision = decisionMap.get(name);
			if (existingDecision) {
				// Update existing decision with merged properties
				const updatedDecision: Decision = {
					name: updates.name ?? existingDecision.name,
					description: updates.description ?? existingDecision.description,
					tags: updates.tags ?? existingDecision.tags,
				};
				// Validate the updated decision is still complete
				const validatedDecision = DecisionSchema.parse(updatedDecision);
				decisionMap.set(name, validatedDecision);
				updateCount++;
			} else {
				throw new Error(
					`Decision '${name}' does not exist. Please create it first.`,
				);
			}
			// Note: We don't create new decisions from updates - use create operation for that
		}
	}

	// Process deletions
	if (decisions.delete) {
		for (const name of decisions.delete) {
			if (decisionMap.delete(name)) {
				deleteCount++;
			}
		}
	}

	// Convert back to array and save
	await saveDecisionsWithPaths(decisionMap, basePath, jsonPath);

	return {
		updateCount,
		insertCount,
		deleteCount,
	};
}

export async function getDecisionIds(): Promise<string[]> {
	const decisions = await loadDecisions();
	return decisions.map((decision) => decision.name);
}

export async function loadDecision(name: string): Promise<Decision | null> {
	const decisions = await loadDecisions();
	return decisions.find((decision) => decision.name === name) || null;
}

export async function processDecisionOperations(
	decisions: DecisionOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	return processDecisionOperationsWithPaths(
		decisions,
		decisionsPath,
		decisionsJsonPath,
	);
}
