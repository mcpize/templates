#!/usr/bin/env node
/**
 * Post-init script for TypeScript default template.
 *
 * Renames "my-mcp-server" to the actual project name in src/index.ts.
 * package.json is already handled by the CLI.
 *
 * Environment variables (set by mcpize init):
 * - MCPIZE_PROJECT_DIR: Target project directory
 * - MCPIZE_PROJECT_NAME: Project name (basename of target dir)
 */

import fs from "node:fs";
import path from "node:path";

const TEMPLATE_NAME = "my-mcp-server";

const projectDir = process.env.MCPIZE_PROJECT_DIR || process.cwd();
const projectName = process.env.MCPIZE_PROJECT_NAME || TEMPLATE_NAME;

if (projectName === TEMPLATE_NAME) {
  process.exit(0);
}

const filePath = path.join(projectDir, "src", "index.ts");
if (!fs.existsSync(filePath)) {
  process.exit(0);
}

const content = fs.readFileSync(filePath, "utf-8");
const updated = content.replace(
  `name: "${TEMPLATE_NAME}"`,
  `name: "${projectName}"`
);

if (content !== updated) {
  fs.writeFileSync(filePath, updated);
  console.log(`  Updated src/index.ts: server name -> "${projectName}"`);
}
