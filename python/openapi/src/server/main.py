"""MCP server generated from OpenAPI specification."""

import contextlib
import json
import logging
import signal
import time
from os import getenv
from pathlib import Path

import httpx
from fastmcp import FastMCP
from fastmcp.server.middleware import Middleware, MiddlewareContext
from rich.console import Console
from starlette.requests import Request
from starlette.responses import JSONResponse

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=getenv("LOG_LEVEL", "INFO"),
)
logger = logging.getLogger(__name__)

# ============================================================================
# Dev Logging Middleware
# ============================================================================

console = Console()
IS_DEV = getenv("ENV", "development") != "production"


def truncate(s: str, max_len: int = 60) -> str:
    """Truncate string with ellipsis."""
    return s if len(s) <= max_len else s[: max_len - 3] + "..."


def format_latency(ms: float) -> str:
    """Color-code latency: green <100ms, yellow 100-500ms, red >500ms."""
    if ms < 100:
        return f"[green]{ms:.0f}ms[/green]"
    if ms < 500:
        return f"[yellow]{ms:.0f}ms[/yellow]"
    return f"[red]{ms:.0f}ms[/red]"


def timestamp() -> str:
    """Get current time as HH:MM:SS."""
    return time.strftime("%H:%M:%S")


class DevLoggingMiddleware(Middleware):
    """Colorized dev logging middleware for MCP requests/responses."""

    async def on_message(self, context: MiddlewareContext, call_next):
        """Log all MCP messages with timing."""
        if not IS_DEV:
            return await call_next(context)

        method = context.method
        message = context.message

        # Skip noisy notifications
        if method == "notifications/initialized":
            return await call_next(context)

        # Log request
        if method == "tools/call" and message:
            tool_name = getattr(message, "name", "unknown")
            tool_args = getattr(message, "arguments", {})
            args_str = truncate(json.dumps(tool_args)) if tool_args else ""
            console.print(
                f"[dim][{timestamp()}][/dim] [cyan]→[/cyan] tools/call [bold]{tool_name}[/bold]"
                + (f" [dim]{args_str}[/dim]" if args_str else "")
            )
        else:
            params_str = ""
            if message:
                with contextlib.suppress(Exception):
                    params_str = (
                        f" [dim]{truncate(json.dumps(message, default=str))}[/dim]"
                    )
            console.print(f"[dim][{timestamp()}][/dim] [cyan]→[/cyan] {method}{params_str}")

        # Execute and time
        start = time.time()
        result = await call_next(context)
        latency_ms = (time.time() - start) * 1000

        # Log response
        latency = format_latency(latency_ms)

        if hasattr(result, "isError") and result.isError:
            error_msg = truncate(str(result))
            console.print(
                f"[dim][{timestamp()}][/dim] [red]✖[/red] {method}"
                f" [red]{error_msg}[/red] ({latency})"
            )
        elif method == "tools/call":
            # Extract tool result for display
            try:
                content = getattr(result, "content", [])
                if content and hasattr(content[0], "text"):
                    result_text = truncate(content[0].text)
                    console.print(
                        f"[dim][{timestamp()}][/dim] [green]←[/green] {result_text} ({latency})"
                    )
                else:
                    console.print(
                        f"[dim][{timestamp()}][/dim] [green]✓[/green] tools/call ({latency})"
                    )
            except Exception:
                console.print(
                    f"[dim][{timestamp()}][/dim] [green]✓[/green] tools/call ({latency})"
                )
        else:
            console.print(f"[dim][{timestamp()}][/dim] [green]✓[/green] {method} ({latency})")

        return result


# ============================================================================
# Configuration
# ============================================================================

OPENAPI_URL = getenv("OPENAPI_URL", "")
API_BASE_URL = getenv("API_BASE_URL", "")

# Local spec file path (relative to project root)
LOCAL_SPEC = Path(__file__).parent.parent.parent / "openapi.json"


def load_spec() -> dict:
    """Load OpenAPI specification from URL or local file.

    Priority:
    1. If OPENAPI_URL is set, try to fetch from URL
    2. Fall back to local openapi.json file
    """
    # Try URL first if configured
    if OPENAPI_URL:
        try:
            logger.info("Loading OpenAPI spec from %s", OPENAPI_URL)
            response = httpx.get(OPENAPI_URL, timeout=10.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning("Failed to fetch spec from URL: %s", e)
            logger.info("Falling back to local file")

    # Fall back to local file
    if LOCAL_SPEC.exists():
        logger.info("Loading OpenAPI spec from %s", LOCAL_SPEC)
        return json.loads(LOCAL_SPEC.read_text())

    raise RuntimeError("No OpenAPI spec available. Set OPENAPI_URL or provide openapi.json file.")


def create_mcp_server() -> FastMCP:
    """Create MCP server from OpenAPI specification."""
    spec = load_spec()

    # Get API title from spec
    title = spec.get("info", {}).get("title", "OpenAPI MCP Server")
    logger.info("Creating MCP server: %s", title)

    # Determine base URL: explicit config > spec servers > error
    base_url = API_BASE_URL
    if not base_url:
        servers = spec.get("servers", [])
        if servers:
            base_url = servers[0].get("url", "")

    if not base_url:
        raise RuntimeError(
            "No API base URL found. Set API_BASE_URL or add servers to OpenAPI spec."
        )

    logger.info("API base URL: %s", base_url)

    # Create HTTP client for API calls
    client = httpx.AsyncClient(base_url=base_url)

    # Generate MCP server from OpenAPI spec
    return FastMCP.from_openapi(
        openapi_spec=spec,
        client=client,
        name=title,
    )


# Create server at module load
mcp = create_mcp_server()

# Add dev logging middleware
mcp.add_middleware(DevLoggingMiddleware())


# Health endpoint
@mcp.custom_route("/health", methods=["GET"])
async def health_check(request: Request) -> JSONResponse:
    return JSONResponse({"status": "healthy"})


def main() -> None:
    """Run the MCP server with graceful shutdown."""
    port = int(getenv("PORT", "8080"))

    console.print()
    console.print("[bold]MCP Server running on[/bold]", f"[cyan]http://localhost:{port}[/cyan]")
    console.print(f"  [dim]Health:[/dim] http://localhost:{port}/health")
    console.print(f"  [dim]MCP:[/dim]    http://localhost:{port}/mcp")

    if IS_DEV:
        console.print()
        console.print("[dim]" + "─" * 50 + "[/dim]")
        console.print()

    def handle_sigterm(*_):
        console.print("[dim]Received SIGTERM, shutting down...[/dim]")
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, handle_sigterm)

    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=port,
    )


if __name__ == "__main__":
    main()
