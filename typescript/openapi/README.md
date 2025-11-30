# OpenAPI MCP Server Template

Create an MCP server from any OpenAPI specification in one command.

## Quick Start

```bash
# Create from OpenAPI URL
mcpize init my-api --template typescript/openapi \
  --from-url https://api.example.com/openapi.yaml

# Or from local file
mcpize init my-api --template typescript/openapi \
  --from-file ./openapi.yaml

# Enter project and deploy
cd my-api
mcpize deploy
```

## Example: Pokemon API

```bash
mcpize init pokemon-mcp --template typescript/openapi \
  --from-url https://raw.githubusercontent.com/dlt-hub/dlt-init-openapi/devel/tests/cases/e2e_specs/pokeapi.yml

cd pokemon-mcp
mcpize deploy --yes
```

## Development

```bash
npm run dev     # Start with hot reload (localhost:8080)
npm run build   # Build for production
npm start       # Run production build
```

## What Gets Generated

The template uses [openapi-mcp-generator](https://github.com/harsha-iiiv/openapi-mcp-generator) to create:

- MCP tools for each OpenAPI endpoint
- Streamable HTTP transport (Cloud Run compatible)
- TypeScript types from OpenAPI schemas
- Automatic request/response validation

## Project Structure

```
my-api/
├── src/
│   ├── index.ts           # MCP server with tools
│   └── streamable-http.ts # HTTP transport
├── mcpize.yaml            # MCPize configuration
├── Dockerfile             # Cloud Run deployment
├── package.json
└── tsconfig.json
```

## Configuration

The server uses environment variables:

- `PORT` - Server port (default: 8080, set by Cloud Run)

## Deployment

```bash
mcpize deploy --yes --wait
```

Your MCP server will be available at:
```
https://mcp-{name}-{hash}.mcpize.cloud/mcp
```
