// ABOUTME: Version utility that imports version from package.json as single source of truth

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

export const VERSION = packageJson.version;
