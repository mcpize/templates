#!/usr/bin/env node

/**
 * Post-init script for OpenAPI template
 *
 * Environment variables (from mcpize init options):
 * - MCPIZE_INIT_FROM_URL: OpenAPI spec URL
 * - MCPIZE_INIT_FROM_FILE: Local OpenAPI spec file path
 * - MCPIZE_PROJECT_DIR: Target project directory
 * - MCPIZE_PROJECT_NAME: Project name
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectDir = process.env.MCPIZE_PROJECT_DIR || process.cwd();
const projectName = process.env.MCPIZE_PROJECT_NAME || "my-openapi-mcp";
const fromUrl = process.env.MCPIZE_INIT_FROM_URL;
const fromFile = process.env.MCPIZE_INIT_FROM_FILE;

// Determine input source
const input = fromUrl || fromFile;

if (!input) {
  console.log("No OpenAPI spec provided. Skipping generation.");
  console.log("You can generate later with:");
  console.log("  mcpize init . --template openapi --from-url <url>");
  process.exit(0);
}

const generatedDir = path.join(projectDir, ".generated");

console.log(`Generating MCP server from: ${input}`);

try {
  // 1. Run openapi-mcp-generator into temp directory (pinned version)
  console.log("Running openapi-mcp-generator@3.2.0...");
  execSync(
    `npx -y openapi-mcp-generator@3.2.0 --input "${input}" --output "${generatedDir}" --transport=streamable-http`,
    { stdio: "inherit" },
  );

  // 2. Copy src/ from generated to project
  const generatedSrc = path.join(generatedDir, "src");
  const projectSrc = path.join(projectDir, "src");

  if (fs.existsSync(generatedSrc)) {
    // Remove existing src if any
    if (fs.existsSync(projectSrc)) {
      fs.rmSync(projectSrc, { recursive: true });
    }

    // Copy generated src
    copyDir(generatedSrc, projectSrc);
    console.log("Copied generated source files.");
  }

  // 3. Merge dependencies from generated package.json
  const generatedPkgPath = path.join(generatedDir, "package.json");
  const projectPkgPath = path.join(projectDir, "package.json");

  if (fs.existsSync(generatedPkgPath) && fs.existsSync(projectPkgPath)) {
    const generatedPkg = JSON.parse(fs.readFileSync(generatedPkgPath, "utf-8"));
    const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, "utf-8"));

    // Merge dependencies
    projectPkg.dependencies = {
      ...projectPkg.dependencies,
      ...generatedPkg.dependencies,
    };

    // Merge devDependencies
    projectPkg.devDependencies = {
      ...projectPkg.devDependencies,
      ...generatedPkg.devDependencies,
    };

    // Take description from generated if not set
    if (
      !projectPkg.description ||
      projectPkg.description === "MCP server generated from OpenAPI spec"
    ) {
      projectPkg.description =
        generatedPkg.description || `MCP Server for ${projectName}`;
    }

    fs.writeFileSync(projectPkgPath, JSON.stringify(projectPkg, null, 2));
    console.log("Merged dependencies into package.json.");
  }

  // 4. Patch PORT in src/index.ts to use process.env.PORT
  const indexPath = path.join(projectSrc, "index.ts");
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, "utf-8");

    // Replace hardcoded port with env variable
    indexContent = indexContent.replace(
      /setupStreamableHttpServer\(server,\s*\d+\)/g,
      'setupStreamableHttpServer(server, parseInt(process.env.PORT || "8080"))',
    );

    fs.writeFileSync(indexPath, indexContent);
    console.log("Patched PORT configuration.");
  }

  // 5. Clean up generated directory
  fs.rmSync(generatedDir, { recursive: true });
  console.log("Cleaned up temporary files.");

  console.log("\nOpenAPI MCP server generated successfully!");
} catch (error) {
  console.error("Failed to generate MCP server:", error.message);

  // Clean up on failure
  if (fs.existsSync(generatedDir)) {
    fs.rmSync(generatedDir, { recursive: true });
  }

  process.exit(1);
}

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
