// ABOUTME: Domain module for managing solutions with CRUD operations

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { baseKnowledgePath } from "./base-knowledge.js";
import {
	type Solution,
	type SolutionOperations,
	SolutionSchema,
	SolutionStoreSchema,
	type Solutions,
} from "./solution-schema.js";

export const solutionsPath = path.join(baseKnowledgePath, "solutions");
export const solutionsJsonPath = path.join(solutionsPath, "solutions.json");

export async function loadSolutionsFromPaths(
	jsonPath: string,
): Promise<Solutions> {
	let solutionsContent: string;
	try {
		solutionsContent = await readFile(jsonPath, "utf-8");
	} catch (_error) {
		// File doesn't exist
		return [];
	}

	return SolutionStoreSchema.parse(JSON.parse(solutionsContent)).solutions;
}

export async function loadSolutions(): Promise<Solutions> {
	return loadSolutionsFromPaths(solutionsJsonPath);
}

async function saveSolutionsWithPaths(
	solutionMap: Map<string, Solution>,
	basePath: string,
	jsonPath: string,
): Promise<void> {
	// Ensure solutions directory exists
	await mkdir(basePath, { recursive: true });

	await writeFile(
		jsonPath,
		JSON.stringify({ solutions: Array.from(solutionMap.values()) }, null, 2),
		"utf-8",
	);
}

export async function saveSolutions(
	solutionMap: Map<string, Solution>,
): Promise<void> {
	return saveSolutionsWithPaths(solutionMap, solutionsPath, solutionsJsonPath);
}

function getSolutionKey(solution: Solution): string {
	// Use problem as unique identifier, normalized
	return solution.problem.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export async function processSolutionOperationsWithPaths(
	solutions: SolutionOperations,
	basePath: string,
	jsonPath: string,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	// Ensure solutions directory exists before any file operations
	await mkdir(basePath, { recursive: true });

	// Load existing solutions
	const existingSolutions: Solutions = await loadSolutionsFromPaths(jsonPath);

	// Convert array to map for easier operations
	const solutionMap = new Map<string, Solution>();
	for (const solution of existingSolutions) {
		solutionMap.set(getSolutionKey(solution), solution);
	}

	let updateCount = 0;
	let insertCount = 0;
	let deleteCount = 0;

	// Process creates - new solutions with complete data
	if (solutions.create) {
		for (const newSolution of solutions.create) {
			const validatedSolution = SolutionSchema.parse(newSolution);
			const key = getSolutionKey(validatedSolution);

			if (solutionMap.has(key)) {
				// If solution already exists, treat as update
				solutionMap.set(key, validatedSolution);
				updateCount++;
			} else {
				// Create new solution
				solutionMap.set(key, validatedSolution);
				insertCount++;
			}
		}
	}

	// Process updates - partial updates to existing solutions
	if (solutions.update) {
		for (const [identifier, updates] of Object.entries(solutions.update)) {
			const existingSolution = solutionMap.get(identifier);
			if (existingSolution) {
				// Update existing solution with merged properties
				const updatedSolution: Solution = {
					problem: updates.problem ?? existingSolution.problem,
					solution: updates.solution ?? existingSolution.solution,
					tags: updates.tags ?? existingSolution.tags,
					codeReferences:
						updates.codeReferences ?? existingSolution.codeReferences,
				};
				// Validate the updated solution is still complete
				const validatedSolution = SolutionSchema.parse(updatedSolution);

				// Remove old entry and add updated one (in case problem changed)
				solutionMap.delete(identifier);
				const newKey = getSolutionKey(validatedSolution);
				solutionMap.set(newKey, validatedSolution);
				updateCount++;
			} else {
				throw new Error(
					`Solution '${identifier}' does not exist. Please create it first.`,
				);
			}
		}
	}

	// Process deletions
	if (solutions.delete) {
		for (const identifier of solutions.delete) {
			if (solutionMap.delete(identifier)) {
				deleteCount++;
			}
		}
	}

	// Convert back to array and save
	await saveSolutionsWithPaths(solutionMap, basePath, jsonPath);

	return {
		updateCount,
		insertCount,
		deleteCount,
	};
}

export async function getSolutionIds(): Promise<string[]> {
	const solutions = await loadSolutions();
	return solutions.map((solution) => getSolutionKey(solution));
}

export async function loadSolution(key: string): Promise<Solution | null> {
	const solutions = await loadSolutions();
	return solutions.find((solution) => getSolutionKey(solution) === key) || null;
}

export async function processSolutionOperations(
	solutions: SolutionOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	return processSolutionOperationsWithPaths(
		solutions,
		solutionsPath,
		solutionsJsonPath,
	);
}
