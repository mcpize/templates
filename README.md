# MCPize Templates

Project templates for [MCPize CLI](https://github.com/mcpize/cli).

## Available Templates

| Template | Description |
|----------|-------------|
| `typescript/default` | TypeScript MCP server (recommended) |
| `typescript/openapi` | Generate MCP from OpenAPI spec |

## Usage

```bash
# Install CLI
npm install -g mcpize

# Create from template
mcpize init my-server --template typescript
mcpize init my-api --template openapi --from-url https://api.example.com/openapi.json
# Python template coming soon
```

## Template Structure

Each template should include:

```
template-name/
├── src/              # Source code
├── Dockerfile        # Container build
├── mcpize.yaml       # MCPize configuration
├── package.json      # Dependencies (for Node.js)
└── CLAUDE.md         # AI assistant instructions (optional)
```

## Contributing

1. Create a new folder under the runtime directory (e.g., `typescript/my-template`)
2. Add required files (Dockerfile, mcpize.yaml, source code)
3. Submit a pull request

## License

MIT
