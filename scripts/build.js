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

			// Copy directory recursively with proper error handling
			const copyDir = (src, dest) => {
				const items = fs.readdirSync(src);
				for (const item of items) {
					const srcPath = path.join(src, item);
					const destPath = path.join(dest, item);

					try {
						const stat = fs.statSync(srcPath);

						if (stat.isDirectory()) {
							fs.mkdirSync(destPath, { recursive: true });
							copyDir(srcPath, destPath);
						} else if (stat.isFile()) {
							fs.copyFileSync(srcPath, destPath);
						}
					} catch (error) {
						console.warn(
							`Warning: Could not copy ${srcPath}: ${error.message}`,
						);
					}
				}
			};

			// Count files recursively for progress reporting
			const countFiles = (dir) => {
				let count = 0;
				const items = fs.readdirSync(dir);
				for (const item of items) {
					const itemPath = path.join(dir, item);
					const stat = fs.statSync(itemPath);
					if (stat.isFile()) {
						count++;
					} else if (stat.isDirectory()) {
						count += countFiles(itemPath);
					}
				}
				return count;
			};

			// Perform the copy
			copyDir(category.sourceDir, category.buildDir);
			const fileCount = countFiles(category.sourceDir);

			console.log(`✓ Copied ${fileCount} ${category.name} to build directory`);
		}
	}

	console.log("✓ Build completed successfully");
} catch (error) {
	console.error("Build error:", error);
	process.exit(1);
}
