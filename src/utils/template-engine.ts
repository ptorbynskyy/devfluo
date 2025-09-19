// ABOUTME: ETA template engine functional utilities for prompt template rendering

import { Eta } from "eta";
import { getSharedTemplatesDir } from "./template-paths.js";

// Singleton ETA instance with configuration
const eta = new Eta({
	views: getSharedTemplatesDir(),
	cache: true,
});

/**
 * Load and render a template file directly
 * @param templatePath - Path to template file relative to prompts/templates directory
 * @param data - Data to pass to the template
 * @returns Rendered template string
 */
export async function renderTemplateFile(
	templatePath: string,
	data: Record<string, unknown> = {},
): Promise<string> {
	// Remove .eta extension if present since ETA views expects template name without extension
	const templateName = templatePath.replace(/\.eta$/, "");

	try {
		return await eta.renderAsync(templateName, data);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const dataKeys = Object.keys(data);
		throw new Error(
			`Failed to render template file '${templatePath}' (template name: '${templateName}'): ${errorMessage}. Available data keys: [${dataKeys.join(", ")}]`,
		);
	}
}
