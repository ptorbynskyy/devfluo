#!/usr/bin/env node

// ABOUTME: Build script for ES module project - sets executable permissions and copies template files after TypeScript compilation

import fs from "node:fs";
import path from "node:path";

const buildFilePath = path.join(process.cwd(), "build", "index.js");

// Template categories configuration
const templateCategories = [
	{
		name: "markdown templates",
		sourceDir: path.join(process.cwd(), "src", "templates"),
		buildDir: path.join(process.cwd(), "build", "templates"),
	},
	{
		name: "prompt templates",
		sourceDir: path.join(process.cwd(), "src", "prompts", "templates"),
		buildDir: path.join(process.cwd(), "build", "prompts", "templates"),
	},
];

try {
	// Make the built file executable
	fs.chmodSync(buildFilePath, "755");
	console.log("✓ Index.js made executable");

	// Copy template files for both categories
	for (const category of templateCategories) {
		if (fs.existsSync(category.sourceDir)) {
			// Create templates directory in build
			fs.mkdirSync(category.buildDir, { recursive: true });

			// Read all files in templates directory
			const templateFiles = fs.readdirSync(category.sourceDir);

			for (const file of templateFiles) {
				const sourcePath = path.join(category.sourceDir, file);
				const destPath = path.join(category.buildDir, file);
				fs.copyFileSync(sourcePath, destPath);
			}

			console.log(
				`✓ Copied ${templateFiles.length} ${category.name} to build directory`,
			);
		}
	}

	console.log("✓ Build completed successfully");
} catch (error) {
	console.error("Build error:", error);
	process.exit(1);
}
