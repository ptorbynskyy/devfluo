#!/usr/bin/env node

// ABOUTME: Build script for ES module project - sets executable permissions and copies template files after TypeScript compilation

import fs from "node:fs";
import path from "node:path";

const buildFilePath = path.join(process.cwd(), "build", "index.js");
const templatesSourceDir = path.join(process.cwd(), "src", "templates");
const templatesBuildDir = path.join(process.cwd(), "build", "templates");

try {
	// Make the built file executable
	fs.chmodSync(buildFilePath, "755");
	console.log("✓ Index.js made executable");

	// Copy template files to build directory
	if (fs.existsSync(templatesSourceDir)) {
		// Create templates directory in build
		fs.mkdirSync(templatesBuildDir, { recursive: true });

		// Read all files in templates directory
		const templateFiles = fs.readdirSync(templatesSourceDir);

		for (const file of templateFiles) {
			const sourcePath = path.join(templatesSourceDir, file);
			const destPath = path.join(templatesBuildDir, file);
			fs.copyFileSync(sourcePath, destPath);
		}

		console.log(
			`✓ Copied ${templateFiles.length} template files to build directory`,
		);
	}

	console.log("✓ Build completed successfully");
} catch (error) {
	console.error("Build error:", error);
	process.exit(1);
}
