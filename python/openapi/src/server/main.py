"""MCP server generated from OpenAPI specification."""

import json
import logging
import signal
from os import getenv
from pathlib import Path

import httpx
from fastmcp import FastMCP

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=getenv("LOG_LEVEL", "INFO"),
)
logger = logging.getLogger(__name__)

# Configuration
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


def main() -> None:
    """Run the MCP server with graceful shutdown."""
    port = int(getenv("PORT", "8080"))
    logger.info("Starting MCP server on port %s", port)

    def handle_sigterm(*_):
        logger.info("Received SIGTERM, shutting down...")
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, handle_sigterm)

    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=port,
    )


if __name__ == "__main__":
    main()
