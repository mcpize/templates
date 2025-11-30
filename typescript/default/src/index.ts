import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { z } from "zod";

// Create MCP server
const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

// Register a simple "hello" tool
server.registerTool(
  "hello",
  {
    title: "Hello Tool",
    description: "Returns a greeting message",
    inputSchema: {
      name: z.string().describe("Name to greet"),
    },
    outputSchema: {
      message: z.string(),
    },
  },
  async ({ name }) => {
    const output = { message: `Hello, ${name}! Welcome to MCP.` };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

// Register an "echo" tool for testing
server.registerTool(
  "echo",
  {
    title: "Echo Tool",
    description: "Echoes back the input text",
    inputSchema: {
      text: z.string().describe("Text to echo"),
    },
    outputSchema: {
      echo: z.string(),
      timestamp: z.string(),
    },
  },
  async ({ text }) => {
    const output = {
      echo: text,
      timestamp: new Date().toISOString(),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

// Setup Express app
const app = express();
app.use(express.json());

// Health check endpoint (required for Cloud Run)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
});

// MCP endpoint
app.post("/mcp", async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Start server
const port = parseInt(process.env.PORT || "8080");
app.listen(port, () => {
  console.log(`MCP Server running on http://localhost:${port}`);
  console.log(`  - Health: http://localhost:${port}/health`);
  console.log(`  - MCP:    http://localhost:${port}/mcp`);
});
