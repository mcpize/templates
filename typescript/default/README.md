# my-mcp-server

MCP server created with [MCPize](https://mcpize.com).

## Quick Start

```bash
npm install
npm run dev     # Start with hot reload
```

Server runs at `http://localhost:8080/mcp`

## Development

```bash
npm run dev     # Development mode with hot reload
npm run build   # Compile TypeScript
npm start       # Run compiled server
```

## Project Structure

```
├── src/
│   └── index.ts        # MCP server entry point
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── mcpize.yaml         # MCPize deployment manifest
├── Dockerfile          # Container build
└── .env.example        # Environment variables template
```

## Tools

- **hello** — Returns a greeting message
- **echo** — Echoes back the input with a timestamp

## Testing

```bash
npx @anthropic-ai/mcp-inspector
```

Connect to `http://localhost:8080/mcp` to test tools interactively.

## Deployment

```bash
mcpize deploy
```

## License

MIT
