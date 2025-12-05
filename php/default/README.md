# MCP Server (PHP)

MCP server built with the [official PHP SDK](https://github.com/modelcontextprotocol/php-sdk).

## Quick Start

```bash
# Install dependencies
composer install

# Run server (stdio)
php server.php

# Or with MCP Inspector
npx @modelcontextprotocol/inspector php server.php
```

## Project Structure

```
├── server.php          # Server entry point
├── src/
│   └── Tools.php       # MCP tools (auto-discovered)
├── composer.json       # Dependencies
├── mcpize.yaml         # MCPize deployment config
└── Dockerfile          # Container build
```

## Adding Tools

Tools are defined using PHP 8 attributes in the `src/` directory:

```php
<?php

namespace App;

use Mcp\Capability\Attribute\McpTool;

class MyTools
{
    /**
     * Description shown to AI models.
     *
     * @param string $param Parameter description
     * @return string Return value description
     */
    #[McpTool]
    public function myTool(string $param): string
    {
        return "Result: {$param}";
    }

    // Custom tool name
    #[McpTool(name: 'custom_name')]
    public function anotherTool(): string
    {
        return "Hello!";
    }
}
```

## Adding Resources

Resources provide read-only data to AI models:

```php
use Mcp\Capability\Attribute\McpResource;

class Resources
{
    #[McpResource(uri: 'config://app', mimeType: 'application/json')]
    public function getConfig(): string
    {
        return json_encode(['env' => getenv('APP_ENV') ?: 'dev']);
    }
}
```

## Adding Prompts

Prompts are reusable templates:

```php
use Mcp\Capability\Attribute\McpPrompt;

class Prompts
{
    #[McpPrompt]
    public function codeReview(string $code, string $language = 'php'): string
    {
        return "Review this {$language} code:\n\n```{$language}\n{$code}\n```";
    }
}
```

## Deployment

```bash
mcpize deploy --yes
```

## Learn More

- [MCP PHP SDK](https://github.com/modelcontextprotocol/php-sdk)
- [MCPize Documentation](https://mcpize.com/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
