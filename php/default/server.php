#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Mcp\Server;
use Mcp\Server\Transport\StdioTransport;

/**
 * MCP Server Entry Point
 *
 * This server uses attribute-based discovery to automatically
 * register tools, resources, and prompts from the src/ directory.
 */

Server::make()
    ->withServerInfo('my-mcp-server', '1.0.0', 'MCP server created with MCPize')
    ->withDiscovery(__DIR__ . '/src', ['.'])
    ->build()
    ->connect(new StdioTransport());
