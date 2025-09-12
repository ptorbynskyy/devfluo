// ABOUTME: Initiative-scoped knowledge operations (decisions, solutions, patterns) with maximum code reuse

import type { DecisionOperations, Decisions } from "../decision-schema.js";
import {
	loadDecisionsFromPaths,
	processDecisionOperationsWithPaths,
} from "../decisions.js";
import type { PatternOperations, Patterns } from "../pattern-schema.js";
import {
	loadPatternsFromPaths,
	processPatternOperationsWithPaths,
} from "../patterns.js";
import type { SolutionOperations, Solutions } from "../solution-schema.js";
import {
	loadSolutionsFromPaths,
	processSolutionOperationsWithPaths,
} from "../solutions.js";
import {
	getInitiativeDecisionsJsonPath,
	getInitiativeDecisionsPath,
	getInitiativePatternsJsonPath,
	getInitiativePatternsPath,
	getInitiativeSolutionsJsonPath,
	getInitiativeSolutionsPath,
} from "./paths.js";

export async function processInitiativeDecisions(
	initiativeId: string,
	decisions: DecisionOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	return processDecisionOperationsWithPaths(
		decisions,
		getInitiativeDecisionsPath(initiativeId),
		getInitiativeDecisionsJsonPath(initiativeId),
	);
}

export async function processInitiativeSolutions(
	initiativeId: string,
	solutions: SolutionOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	return processSolutionOperationsWithPaths(
		solutions,
		getInitiativeSolutionsPath(initiativeId),
		getInitiativeSolutionsJsonPath(initiativeId),
	);
}

export async function processInitiativePatterns(
	initiativeId: string,
	patterns: PatternOperations,
): Promise<{
	updateCount: number;
	insertCount: number;
	deleteCount: number;
}> {
	return processPatternOperationsWithPaths(
		patterns,
		getInitiativePatternsPath(initiativeId),
		getInitiativePatternsJsonPath(initiativeId),
	);
}

// Load initiative-specific decisions
export async function loadInitiativeDecisions(
	initiativeId: string,
): Promise<Decisions> {
	return loadDecisionsFromPaths(getInitiativeDecisionsJsonPath(initiativeId));
}

// Load initiative-specific solutions
export async function loadInitiativeSolutions(
	initiativeId: string,
): Promise<Solutions> {
	return loadSolutionsFromPaths(getInitiativeSolutionsJsonPath(initiativeId));
}

// Load initiative-specific patterns
export async function loadInitiativePatterns(
	initiativeId: string,
): Promise<Patterns> {
	return loadPatternsFromPaths(getInitiativePatternsJsonPath(initiativeId));
}
