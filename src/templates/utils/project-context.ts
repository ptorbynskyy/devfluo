// ABOUTME: Shared project context loading functionality for specification prompts

import {
	getArchitectureKnowledge,
	getCodebaseKnowledge,
} from "../../domain/base-knowledge.js";
import type { Issue } from "../../domain/initiative/issue-schema.js";
import { loadIssues } from "../../domain/initiative/issues.js";
import type { InitiativeWithOverview } from "../../domain/initiative/schema.js";
import type { Task } from "../../domain/initiative/task-schema.js";
import { loadTasks } from "../../domain/initiative/tasks.js";
import { getContextMemoryCards } from "../../domain/memory/get-context-memory-cards.js";
import type { MemoryCard } from "../../domain/memory/memory-card-schema.js";

export interface ProjectContext {
	architecture: string;
	codebase: string;
	memoryCards: MemoryCard[];
}

export interface InitiativeContext extends ProjectContext {
	initiative: InitiativeWithOverview;
	tasks: Task[];
	issues: Issue[];
	initiativeMemoryCards: MemoryCard[];
}

export async function loadProjectContext(options?: {
	includeAllMemoryCards?: boolean;
	semanticQueries?: string[];
}): Promise<ProjectContext> {
	const [architecture, codebase, memoryCards] = await Promise.all([
		getArchitectureKnowledge(),
		getCodebaseKnowledge(),
		getContextMemoryCards("global", options),
	]);

	return {
		architecture: architecture ?? "",
		codebase: codebase ?? "",
		memoryCards,
	};
}

export async function loadInitiativeContext(
	initiative: InitiativeWithOverview,
): Promise<InitiativeContext> {
	const semanticQueries = [
		initiative.name,
		initiative.overview,
		initiative.spec,
	].filter((i) => i !== undefined);

	const [projectContext, tasks, issues, initiativeMemoryCards] =
		await Promise.all([
			loadProjectContext({
				semanticQueries,
			}),
			loadTasks(initiative.id),
			loadIssues(initiative.id),
			getContextMemoryCards(initiative.id, {
				semanticQueries,
			}),
		]);

	return {
		...projectContext,
		initiative,
		tasks,
		issues,
		initiativeMemoryCards,
	};
}
