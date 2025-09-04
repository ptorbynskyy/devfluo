// ABOUTME: Domain module for managing patterns with CRUD operations

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { baseKnowledgePath } from "./base-knowledge.js";
import {
	type Pattern,
	type PatternOperations,
	PatternSchema,
	PatternStoreSchema,
	type Patterns,
} from "./pattern-schema.js";

export const patternsPath = path.join(baseKnowledgePath, "patterns");
export const patternsJsonPath = path.join(patternsPath, "patterns.json");

export async function loadPatterns(): Promise<Patterns> {
	let patternsContent: string;
	try {
		patternsContent = await readFile(patternsJsonPath, "utf-8");
	} catch (_error) {
		// File doesn't exist
		return [];
	}

	return PatternStoreSchema.parse(JSON.parse(patternsContent)).patterns;
}

async function savePatterns(patternMap: Map<string, Pattern>): Promise<void> {
	// Ensure patterns directory exists
	await mkdir(patternsPath, { recursive: true });

	await writeFile(
		patternsJsonPath,
		JSON.stringify({ patterns: Array.from(patternMap.values()) }, null, 2),
		"utf-8",
	);
}

export async function processPatternOperations(
	patterns: PatternOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	// Load existing patterns
	const existingPatterns: Patterns = await loadPatterns();

	// Convert array to map for easier operations
	const patternMap = new Map<string, Pattern>();
	for (const pattern of existingPatterns) {
		patternMap.set(pattern.name, pattern);
	}

	let updateCount = 0;
	let insertCount = 0;
	let deleteCount = 0;

	// Process creates - new patterns with complete data
	if (patterns.create) {
		for (const newPattern of patterns.create) {
			// Validate that the pattern has all required fields
			const validatedPattern = PatternSchema.parse(newPattern);

			if (patternMap.has(validatedPattern.name)) {
				// If pattern already exists, treat as update
				patternMap.set(validatedPattern.name, validatedPattern);
				updateCount++;
			} else {
				// Create new pattern
				patternMap.set(validatedPattern.name, validatedPattern);
				insertCount++;
			}
		}
	}

	// Process updates - partial updates to existing patterns
	if (patterns.update) {
		for (const [name, updates] of Object.entries(patterns.update)) {
			const existingPattern = patternMap.get(name);
			if (existingPattern) {
				// Update existing pattern with merged properties
				const updatedPattern: Pattern = {
					name: updates.name ?? existingPattern.name,
					description: updates.description ?? existingPattern.description,
					tags: updates.tags ?? existingPattern.tags,
					snippetFilename:
						updates.snippetFilename ?? existingPattern.snippetFilename,
					codeReferences:
						updates.codeReferences ?? existingPattern.codeReferences,
				};
				// Validate the updated pattern is still complete
				const validatedPattern = PatternSchema.parse(updatedPattern);
				patternMap.set(name, validatedPattern);
				updateCount++;
			} else {
				throw new Error(
					`Pattern '${name}' does not exist. Please create it first.`,
				);
			}
			// Note: We don't create new patterns from updates - use create operation for that
		}
	}

	// Process deletions
	if (patterns.delete) {
		for (const name of patterns.delete) {
			if (patternMap.delete(name)) {
				deleteCount++;
			}
		}
	}

	// Convert back to array and save
	await savePatterns(patternMap);

	return {
		updateCount,
		insertCount,
		deleteCount,
	};
}
