// ABOUTME: Initiative-scoped knowledge operations (decisions, solutions, patterns) with maximum code reuse

import type { DecisionOperations } from "../decision-schema.js";
import { processDecisionOperationsWithPaths } from "../decisions.js";
import type { PatternOperations } from "../pattern-schema.js";
import { processPatternOperationsWithPaths } from "../patterns.js";
import type { SolutionOperations } from "../solution-schema.js";
import { processSolutionOperationsWithPaths } from "../solutions.js";
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
