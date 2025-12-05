# OpenAPI MCP Server

MCP server generated from OpenAPI specification using [FastMCP](https://gofastmcp.com/).

## Quick Start

```bash
# Install dependencies
uv sync

# Run locally
uv run python -m server.main

# Or with environment variables
OPENAPI_URL=https://api.example.com/openapi.json \
API_BASE_URL=https://api.example.com \
uv run python -m server.main
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAPI_URL` | URL to fetch OpenAPI spec (optional) | Falls back to local `openapi.json` |
| `API_BASE_URL` | Base URL for API calls | Extracted from spec `servers[0].url` |
| `PORT` | Server port | `8080` |
| `LOG_LEVEL` | Logging level | `INFO` |

## How It Works

1. On startup, the server loads the OpenAPI specification
2. If `OPENAPI_URL` is set, it fetches from URL (with fallback to local file)
3. FastMCP automatically converts OpenAPI endpoints to MCP tools
4. Each API endpoint becomes an MCP tool that AI models can call

## Development

```bash
# Install dev dependencies
uv sync

# Run with auto-reload (if using watchfiles)
uv run python -m server.main

# Run tests
uv run pytest
```

## Deployment

```bash
# Deploy to MCPize
mcpize deploy --yes
```

## Updating the API

To update when the upstream API changes:

1. **If using OPENAPI_URL**: Just restart the server
2. **If using local file**: Re-download the spec:
   ```bash
   curl -o openapi.json https://api.example.com/openapi.json
   ```

## Learn More

- [FastMCP Documentation](https://gofastmcp.com/)
- [MCPize Documentation](https://mcpize.com/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
