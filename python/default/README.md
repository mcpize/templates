# my-mcp-server

MCP server built with [FastMCP 2.0](https://gofastmcp.com) for [MCPize](https://mcpize.com).

## Requirements

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)

## Quick Start

```bash
make dev        # Install all dependencies
make run        # Start server
```

Server runs at `http://localhost:8080/mcp`

## Development

```bash
make test       # Run tests
make lint       # Check code style
make format     # Auto-format code
```

## Tools

| Tool | Description |
|------|-------------|
| `hello` | Returns a greeting message |
| `echo` | Echoes input with timestamp |
| `delayed_echo` | Async echo with configurable delay |

## Testing

```bash
npx @anthropic-ai/mcp-inspector http://localhost:8080/mcp
```

## Deploy

```bash
mcpize deploy
```

## Project Structure

```
├── src/my_mcp_server/
│   ├── __init__.py
│   ├── server.py       # MCP server and tools
│   └── py.typed        # PEP 561 marker
├── tests/
│   └── test_tools.py
├── pyproject.toml
├── Makefile
└── Dockerfile
```

## License

MIT
