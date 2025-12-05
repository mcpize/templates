# OpenAPI MCP Server Development Guide

Python MCP server generated from OpenAPI specification using FastMCP 2.0.

## Project Structure

```
├── src/server/
│   ├── __init__.py     # Package marker
│   └── main.py         # FastMCP.from_openapi() entry point
├── openapi.json        # OpenAPI specification (downloaded at init)
├── pyproject.toml      # Dependencies
├── Dockerfile          # Container build
├── mcpize.yaml         # MCPize deployment config
└── .env.example        # Environment template
```

## How It Works

This server uses FastMCP's `from_openapi()` to automatically convert OpenAPI endpoints into MCP tools:

```python
mcp = FastMCP.from_openapi(
    openapi_spec=spec,
    client=httpx.AsyncClient(base_url=api_url),
    name="API Name",
)
```

Every API endpoint becomes an MCP tool that AI models can call.

## Commands

```bash
uv sync                          # Install dependencies
uv run python -m server.main     # Start server
```

## Configuration

| Variable | Description |
|----------|-------------|
| `OPENAPI_URL` | URL to fetch spec (optional, falls back to local file) |
| `API_BASE_URL` | Base URL for API calls (overrides spec) |
| `PORT` | Server port (default: 8080) |
| `LOG_LEVEL` | Logging level (default: INFO) |

## Spec Loading Priority

1. If `OPENAPI_URL` is set → fetch from URL
2. If URL fails or not set → use local `openapi.json`
3. If neither available → error

## Customizing Tool Behavior

To customize how endpoints are mapped to MCP tools, edit `main.py`:

```python
from fastmcp import FastMCP
from fastmcp.utilities.openapi import RouteMap, MCPType

# Make all endpoints tools (default behavior)
route_maps = [RouteMap(mcp_type=MCPType.TOOL)]

# Or exclude certain paths
route_maps = [
    RouteMap(pattern="/internal/*", mcp_type=MCPType.EXCLUDE),
    RouteMap(mcp_type=MCPType.TOOL),
]

mcp = FastMCP.from_openapi(
    openapi_spec=spec,
    client=client,
    route_maps=route_maps,
)
```

## Adding Custom Tools

You can add custom tools alongside auto-generated ones:

```python
# In main.py, after creating mcp

@mcp.tool()
def custom_tool(param: str) -> str:
    """Custom tool description."""
    return f"Result: {param}"
```

## Updating the OpenAPI Spec

**Option 1: Runtime update (if OPENAPI_URL is set)**
- Just restart the server

**Option 2: Manual update**
```bash
curl -o openapi.json https://api.example.com/openapi.json
```

**Option 3: Re-initialize**
```bash
mcpize init . --template python/openapi --from-url https://api.example.com/openapi.json
```

## Deployment

```bash
mcpize deploy --yes
```

## Best Practices

1. **Keep local spec**: Always have `openapi.json` as fallback
2. **API_BASE_URL**: Set explicitly if API URL differs from spec
3. **Timeouts**: The default HTTP timeout is 10s for spec fetch
4. **Logging**: Check logs for spec loading issues
5. **Testing**: Test with actual API before deploying

## Troubleshooting

**"No OpenAPI spec available"**
- Check `openapi.json` exists in project root
- Verify `OPENAPI_URL` is accessible

**Tools not appearing**
- Check OpenAPI spec is valid JSON
- Verify endpoints have proper operationId
- Check FastMCP logs for parsing errors

**API calls failing**
- Verify `API_BASE_URL` is correct
- Check API authentication requirements
- Review httpx client configuration
