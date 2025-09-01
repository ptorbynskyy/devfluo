// ABOUTME: Configuration module that loads and validates configuration from environment variables

import { z } from "zod";

// Configuration schema using Zod
const configSchema = z.object({
	PROJECT_ROOT: z.string().min(1, "PROJECT_ROOT must be a non-empty path"),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
	const rawConfig = {
		PROJECT_ROOT: process.env.PROJECT_ROOT?.trim(),
	};

	try {
		return configSchema.parse(rawConfig);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const issues = error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join(", ");
			throw new Error(`Configuration validation failed: ${issues}`);
		}
		throw error;
	}
}

// Export singleton config instance
export const config = loadConfig();
