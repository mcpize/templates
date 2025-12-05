#!/usr/bin/env python3
"""Post-init script for Python OpenAPI template.

Environment variables (from mcpize init options):
- MCPIZE_INIT_FROM_URL: OpenAPI spec URL
- MCPIZE_INIT_FROM_FILE: Local OpenAPI spec file path
- MCPIZE_INIT_API_BASE_URL: Override API base URL
- MCPIZE_PROJECT_DIR: Target project directory
- MCPIZE_PROJECT_NAME: Project name
"""

import json
import os
import sys
from pathlib import Path
from urllib.request import urlopen

project_dir = Path(os.environ.get("MCPIZE_PROJECT_DIR", "."))
project_name = os.environ.get("MCPIZE_PROJECT_NAME", "my-openapi-mcp")
from_url = os.environ.get("MCPIZE_INIT_FROM_URL", "")
from_file = os.environ.get("MCPIZE_INIT_FROM_FILE", "")
api_base_url = os.environ.get("MCPIZE_INIT_API_BASE_URL", "")

spec_path = project_dir / "openapi.json"
env_path = project_dir / ".env.example"


def load_yaml(content: str) -> dict:
    """Simple YAML loader for OpenAPI specs (handles basic cases)."""
    try:
        import yaml

        return yaml.safe_load(content)
    except ImportError:
        print("Warning: PyYAML not installed, trying JSON parse")
        return json.loads(content)


def main():
    if not from_url and not from_file:
        print("No OpenAPI spec provided. Skipping download.")
        print("You can:")
        print("  1. Set OPENAPI_URL env var before running")
        print("  2. Replace openapi.json manually")
        print("  3. Re-run: mcpize init . --template python/openapi --from-url <url>")
        return

    spec = None

    # Load from URL
    if from_url:
        print(f"Downloading OpenAPI spec from {from_url}")
        try:
            with urlopen(from_url, timeout=30) as resp:
                content = resp.read().decode("utf-8")
                if from_url.endswith((".yaml", ".yml")):
                    spec = load_yaml(content)
                else:
                    spec = json.loads(content)
            print(f"Downloaded: {spec.get('info', {}).get('title', 'Unknown API')}")
        except Exception as e:
            print(f"Error downloading spec: {e}")
            sys.exit(1)

    # Load from file
    elif from_file:
        file_path = Path(from_file)
        if not file_path.is_absolute():
            file_path = project_dir / file_path

        print(f"Loading OpenAPI spec from {file_path}")
        try:
            content = file_path.read_text()
            if from_file.endswith((".yaml", ".yml")):
                spec = load_yaml(content)
            else:
                spec = json.loads(content)
            print(f"Loaded: {spec.get('info', {}).get('title', 'Unknown API')}")
        except Exception as e:
            print(f"Error loading spec: {e}")
            sys.exit(1)

    # Save spec as JSON
    spec_path.write_text(json.dumps(spec, indent=2))
    print(f"Saved OpenAPI spec to {spec_path}")

    # Extract API base URL from spec if not provided
    extracted_base_url = api_base_url
    if not extracted_base_url:
        servers = spec.get("servers", [])
        if servers:
            server_url = servers[0].get("url", "")
            # Handle relative URLs - derive base from spec URL
            if server_url.startswith("/") and from_url:
                from urllib.parse import urlparse

                parsed = urlparse(from_url)
                extracted_base_url = f"{parsed.scheme}://{parsed.netloc}{server_url}"
            else:
                extracted_base_url = server_url

    # Update .env.example
    env_content = f"""# OpenAPI Configuration
OPENAPI_URL={from_url}
API_BASE_URL={extracted_base_url}

# Server Configuration
PORT=8080
LOG_LEVEL=INFO
"""
    env_path.write_text(env_content)
    print("Updated .env.example with configuration")

    # Update pyproject.toml name if needed
    pyproject_path = project_dir / "pyproject.toml"
    if pyproject_path.exists() and project_name != "my-openapi-mcp":
        content = pyproject_path.read_text()
        content = content.replace('name = "my-openapi-mcp"', f'name = "{project_name}"')
        pyproject_path.write_text(content)
        print(f"Updated project name to {project_name}")

    print("\nOpenAPI MCP server initialized successfully!")
    print(f"API: {spec.get('info', {}).get('title', 'Unknown')}")
    print(f"Base URL: {extracted_base_url}")


if __name__ == "__main__":
    main()
