# OpenAPI MCP Server Development Guide

This is an MCP server generated from an OpenAPI specification using MCPize.

## Project Structure

```
├── src/
│   ├── index.ts           # MCP server entry point (generated)
│   └── streamable-http.ts # HTTP transport handler
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── mcpize.yaml            # MCPize deployment manifest
└── Dockerfile             # Container build instructions
```

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Run in development mode with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled server
```

## How It Works

The server is generated from an OpenAPI spec using `openapi-mcp-generator`:

1. Each OpenAPI endpoint becomes an MCP tool
2. Request/response schemas are converted to Zod validation
3. Streamable HTTP transport enables Cloud Run deployment

## Regenerating from OpenAPI

To regenerate from an updated OpenAPI spec:

```bash
# Delete existing src/ and regenerate
rm -rf src/
npx openapi-mcp-generator@3.2.0 --input <spec-url> --output . --transport=streamable-http
```

## Adding Custom Tools

You can extend the generated server by adding tools in `src/index.ts`:

```typescript
server.registerTool(
  "custom-tool",
  {
    title: "Custom Tool",
    description: "Your custom functionality",
    inputSchema: {
      param: z.string().describe("Parameter"),
    },
  },
  async ({ param }) => ({
    content: [{ type: "text", text: `Result: ${param}` }],
  })
);
```

## Environment Variables

- `PORT`: Server port (default: 8080, set by MCPize/Cloud Run)
- Add API keys and other secrets via MCPize dashboard

## Testing

Use MCP Inspector to test your server:

```bash
npx @anthropic-ai/mcp-inspector
```

Connect to `http://localhost:8080/mcp` to test tools.

## Deployment

```bash
mcpize deploy --yes
```

## Best Practices

1. **Don't modify generated code directly** — changes may be lost on regeneration
2. **Add custom tools at the end of index.ts** — easier to preserve during updates
3. **Use environment variables** — never hardcode API keys or secrets
4. **Test with MCP Inspector** — verify all endpoints work before deploying
5. **Pin generator version** — use `openapi-mcp-generator@3.2.0` for consistency

