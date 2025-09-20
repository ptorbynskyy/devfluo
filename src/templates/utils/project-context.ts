// ABOUTME: Shared project context loading functionality for specification prompts

import {
	getArchitectureKnowledge,
	getCodebaseKnowledge,
} from "../../domain/base-knowledge.js";
import type { Decision } from "../../domain/decision-schema.js";
import type { Issue } from "../../domain/initiative/issue-schema.js";
import { loadIssues } from "../../domain/initiative/issues.js";
import {
	loadInitiativeDecisions,
	loadInitiativePatterns,
	loadInitiativeSolutions,
} from "../../domain/initiative/knowledge.js";
import type { InitiativeWithOverview } from "../../domain/initiative/schema.js";
import type { Task } from "../../domain/initiative/task-schema.js";
import { loadTasks } from "../../domain/initiative/tasks.js";
import type { MemoryCard } from "../../domain/memory-card-schema.js";
import { loadGlobalMemoryCards } from "../../domain/memory-cards.js";
import type { Pattern } from "../../domain/pattern-schema.js";
import type { Solution } from "../../domain/solution-schema.js";

export interface ProjectContext {
	architecture: string;
	codebase: string;
	memoryCards: MemoryCard[];
}

export interface InitiativeContext extends ProjectContext {
	initiative: InitiativeWithOverview;
	tasks: Task[];
	issues: Issue[];
	initiativeDecisions: Decision[];
	initiativeSolutions: Solution[];
	initiativePatterns: Pattern[];
}

export async function loadProjectContext(options?: {
	includeAllMemoryCards?: boolean;
}): Promise<ProjectContext> {
	const [architecture, codebase, memoryCards] = await Promise.all([
		getArchitectureKnowledge(),
		getCodebaseKnowledge(),
		loadGlobalMemoryCards(),
	]);

	return {
		architecture: architecture ?? "",
		codebase: codebase ?? "",
		memoryCards: memoryCards.filter(
			(i) =>
				i.contextIncludingPolicy === "always" ||
				options?.includeAllMemoryCards === true,
		),
	};
}

export async function loadInitiativeContext(
	initiative: InitiativeWithOverview,
): Promise<InitiativeContext> {
	const [
		projectContext,
		tasks,
		issues,
		initiativeDecisions,
		initiativeSolutions,
		initiativePatterns,
	] = await Promise.all([
		loadProjectContext(),
		loadTasks(initiative.id),
		loadIssues(initiative.id),
		loadInitiativeDecisions(initiative.id),
		loadInitiativeSolutions(initiative.id),
		loadInitiativePatterns(initiative.id),
	]);

	return {
		...projectContext,
		initiative,
		tasks,
		issues,
		initiativeDecisions,
		initiativeSolutions,
		initiativePatterns,
	};
}
