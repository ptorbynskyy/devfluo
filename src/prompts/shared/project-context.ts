// ABOUTME: Shared project context loading functionality for specification prompts

import type { Decision } from "../../domain/decision-schema.js";
import { loadDecisions } from "../../domain/decisions.js";
import {
	loadInitiativeDecisions,
	loadInitiativePatterns,
	loadInitiativeSolutions,
} from "../../domain/initiative/knowledge.js";
import type { InitiativeWithOverview } from "../../domain/initiative/schema.js";
import type { Task } from "../../domain/initiative/task-schema.js";
import { loadTasks } from "../../domain/initiative/tasks.js";
import type { Pattern } from "../../domain/pattern-schema.js";
import { loadPatterns } from "../../domain/patterns.js";
import type { Solution } from "../../domain/solution-schema.js";
import { loadSolutions } from "../../domain/solutions.js";
import { getProjectKnowledge } from "../../resources/knowledge.js";

export interface ProjectContext {
	knowledge: string;
	decisions: Decision[];
	solutions: Solution[];
	patterns: Pattern[];
}

export interface InitiativeContext extends ProjectContext {
	initiative: InitiativeWithOverview;
	tasks: Task[];
	initiativeDecisions: Decision[];
	initiativeSolutions: Solution[];
	initiativePatterns: Pattern[];
}

export async function loadProjectContext(): Promise<ProjectContext> {
	const [knowledge, decisions, solutions, patterns] = await Promise.all([
		getProjectKnowledge(),
		loadDecisions(),
		loadSolutions(),
		loadPatterns(),
	]);

	return {
		knowledge,
		decisions,
		solutions,
		patterns,
	};
}

export async function loadInitiativeContext(
	initiative: InitiativeWithOverview,
): Promise<InitiativeContext> {
	const [
		projectContext,
		tasks,
		initiativeDecisions,
		initiativeSolutions,
		initiativePatterns,
	] = await Promise.all([
		loadProjectContext(),
		loadTasks(initiative.id),
		loadInitiativeDecisions(initiative.id),
		loadInitiativeSolutions(initiative.id),
		loadInitiativePatterns(initiative.id),
	]);

	return {
		...projectContext,
		initiative,
		tasks,
		initiativeDecisions,
		initiativeSolutions,
		initiativePatterns,
	};
}
