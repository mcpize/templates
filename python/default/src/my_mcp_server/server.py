"""MCP server entry point."""

import logging
import signal
from os import getenv

from fastmcp import FastMCP

from .tools import delayed_echo, echo, hello

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=getenv("LOG_LEVEL", "INFO"),
)
logger = logging.getLogger(__name__)

mcp = FastMCP("my-mcp-server")

# Register tools
mcp.tool()(hello)
mcp.tool()(echo)
mcp.tool()(delayed_echo)


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
