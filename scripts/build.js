#!/usr/bin/env node

// ABOUTME: Build script for ES module project - sets executable permissions after TypeScript compilation

import fs from "node:fs";
import path from "node:path";

const buildFilePath = path.join(process.cwd(), "build", "index.js");

try {
	// Make the built file executable
	fs.chmodSync(buildFilePath, "755");
	console.log("✓ Build completed and index.js made executable");
} catch (error) {
	console.error("Error setting executable permissions:", error);
	process.exit(1);
}
