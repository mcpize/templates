# MCP Server Development Guide (PHP)

PHP MCP server built with the official MCP PHP SDK.

## Project Structure

```
├── server.php          # Server entry point (stdio transport)
├── src/
│   └── Tools.php       # MCP tools with #[McpTool] attributes
├── composer.json       # Dependencies
├── mcpize.yaml         # MCPize deployment config
└── Dockerfile          # Container build
```

## Commands

```bash
composer install        # Install dependencies
php server.php          # Run server (stdio)
composer test           # Run tests
```

## Adding Tools

Define tools in `src/` using PHP 8 attributes:

```php
<?php

namespace App;

use Mcp\Capability\Attribute\McpTool;

class Tools
{
    /**
     * Tool description (shown to AI).
     *
     * @param string $input Input parameter
     * @return string Result
     */
    #[McpTool]
    public function myTool(string $input): string
    {
        return "Processed: {$input}";
    }

    // Custom tool name
    #[McpTool(name: 'custom_name')]
    public function anotherTool(int $count = 1): array
    {
        return ['count' => $count];
    }
}
```

**Key points:**
- Use `#[McpTool]` attribute to expose methods
- PHPDoc `@param` and `@return` become tool schema
- Method description becomes tool description
- Supports: string, int, float, bool, array return types

## Adding Resources

```php
use Mcp\Capability\Attribute\McpResource;

class Resources
{
    #[McpResource(uri: 'file://config.json', mimeType: 'application/json')]
    public function getConfig(): string
    {
        return file_get_contents(__DIR__ . '/../config.json');
    }
}
```

## Adding Prompts

```php
use Mcp\Capability\Attribute\McpPrompt;

class Prompts
{
    #[McpPrompt]
    public function reviewCode(string $code): string
    {
        return "Please review this code:\n\n```\n{$code}\n```";
    }
}
```

## Auto-Discovery

The server automatically discovers all classes with MCP attributes in `src/`:

```php
Server::make()
    ->withDiscovery(__DIR__ . '/src', ['.'])
    ->build();
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `0` | Enable debug output |
| `FILE_LOG` | `0` | Enable file logging |

## Testing with Inspector

```bash
# Basic
npx @modelcontextprotocol/inspector php server.php

# With debug
npx @modelcontextprotocol/inspector -e DEBUG=1 php server.php
```

## Deployment

```bash
mcpize deploy --yes
```

## Best Practices

1. **Type hints**: Always use strict types for parameters and returns
2. **PHPDoc**: Write clear descriptions - they become tool docs for AI
3. **Validation**: Validate inputs, return clear error messages
4. **Stateless**: Tools should be stateless when possible
5. **Async**: For I/O operations, consider async patterns
