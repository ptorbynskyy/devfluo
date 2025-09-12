import type { Task } from "./task-schema.js";

export function generateTasksMarkdownReport(tasks: Task[]): string {
	let markdown = "";
	// Group tasks by phase
	const tasksByPhase = tasks.reduce(
		(acc, task) => {
			const phaseTasks = acc[task.phase] ?? [];
			phaseTasks.push(task);
			acc[task.phase] = phaseTasks;
			return acc;
		},
		{} as Record<number, typeof tasks>,
	);

	// Sort phases by number
	const phases = Object.keys(tasksByPhase)
		.map(Number)
		.sort((a, b) => a - b);

	for (const phaseNum of phases) {
		const phaseTasks = tasksByPhase[phaseNum];
		if (!phaseTasks) continue;
		markdown += `### Phase ${phaseNum}\n\n`;

		// Create table
		markdown += `| ID | Name | Effort | Status | Predecessors | Description |\n`;
		markdown += `|---|---|---|---|---|---|\n`;

		// Sort tasks by order within phase
		const sortedTasks = phaseTasks.sort((a, b) => a.order - b.order);

		for (const task of sortedTasks) {
			const effort = task.effort || "-";
			const status = task.status === "done" ? "✅ Done" : "🔲 New";
			const predecessors = task.predecessors.length > 0 ? task.predecessors.join(", ") : "-";
			markdown += `| ${task.id} | ${task.name} | ${effort} | ${status} | ${predecessors} | ${task.description} |\n`;
		}

		markdown += `\n`;
	}
	return markdown;
}
