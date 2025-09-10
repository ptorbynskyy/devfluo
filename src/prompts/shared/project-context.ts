// ABOUTME: Shared project context loading functionality for specification prompts

import type { Decision } from "../../domain/decision-schema.js";
import { loadDecisions } from "../../domain/decisions.js";
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
