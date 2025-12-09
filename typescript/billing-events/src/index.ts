import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import { createBilling } from "./billing.js";

// Create MCP server
const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

// Create billing instance for MCPize event billing
// Configure events in MCPize dashboard: Monetize > Events
const billing = createBilling();

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
  },
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
  },
);

// Example: Tool with event billing
// To use this, create an event "premium-analysis" in MCPize dashboard
server.registerTool(
  "analyze",
  {
    title: "Premium Analysis",
    description: "Perform premium analysis (charged per use)",
    inputSchema: {
      data: z.string().describe("Data to analyze"),
    },
    outputSchema: {
      result: z.string(),
      tokens: z.number(),
    },
  },
  async ({ data }) => {
    // Perform your analysis logic here
    const result = `Analysis of: ${data.substring(0, 50)}...`;
    const tokens = data.length;

    // Charge for this premium feature
    // Event must be configured in MCPize dashboard: Monetize > Events
    billing.charge("premium-analysis");

    const output = { result, tokens };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  },
);

// Setup Express app
const app = express();
app.use(express.json());

// Health check endpoint (required for Cloud Run)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
});

// MCP endpoint with billing middleware
// The billing.middleware() adds X-MCPize-Charge header to responses
app.post("/mcp", billing.middleware(), async (req: Request, res: Response) => {
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
