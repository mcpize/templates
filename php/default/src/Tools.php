<?php

declare(strict_types=1);

namespace App;

use Mcp\Capability\Attribute\McpTool;

/**
 * Example MCP Tools
 *
 * Tools are functions that can be called by AI models.
 * Use the #[McpTool] attribute to expose methods as MCP tools.
 */
class Tools
{
    /**
     * Says hello to someone.
     *
     * @param string $name The name to greet
     * @return string A friendly greeting
     */
    #[McpTool]
    public function hello(string $name = 'World'): string
    {
        return "Hello, {$name}!";
    }

    /**
     * Echoes back the input message.
     *
     * @param string $message The message to echo
     * @return string The same message
     */
    #[McpTool]
    public function echo(string $message): string
    {
        return $message;
    }

    /**
     * Adds two numbers together.
     *
     * @param int $a The first number
     * @param int $b The second number
     * @return int The sum of a and b
     */
    #[McpTool(name: 'add')]
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }

    /**
     * Performs a calculation with two numbers.
     *
     * @param float $a The first number
     * @param float $b The second number
     * @param string $operation The operation: add, subtract, multiply, divide
     * @return float|string The result or error message
     */
    #[McpTool]
    public function calculate(float $a, float $b, string $operation = 'add'): float|string
    {
        return match ($operation) {
            'add' => $a + $b,
            'subtract' => $a - $b,
            'multiply' => $a * $b,
            'divide' => $b != 0 ? $a / $b : 'Error: Division by zero',
            default => "Error: Unknown operation '{$operation}'"
        };
    }
}
