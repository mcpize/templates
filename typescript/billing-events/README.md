# my-mcp-server

[![MCPize](https://mcpize.com/badge/@mcpize/mcpize?type=hosted)](https://mcpize.com)

MCP server with event billing, created with [MCPize](https://mcpize.com).

## Quick Start

```bash
npm install
npm run dev     # Start with hot reload
```

Server runs at `http://localhost:8080/mcp`

## Development

```bash
npm run dev     # Development mode with hot reload
npm run build   # Compile TypeScript
npm test        # Run tests
npm start       # Run compiled server
```

## Project Structure

```
├── src/
│   ├── index.ts        # MCP server entry point
│   ├── tools.ts        # Pure tool functions (testable)
│   └── billing.ts      # MCPize event billing helper
├── tests/
│   └── tools.test.ts   # Tool unit tests
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── mcpize.yaml         # MCPize deployment manifest
├── Dockerfile          # Container build
└── .env.example        # Environment variables template
```

## Tools

- **hello** — Returns a greeting message
- **echo** — Echoes back the input with a timestamp
- **analyze** — Example tool with event billing

## Billing

This template includes MCPize event billing. Charge for tool usage:

```typescript
billing.charge("event-name");      // Charge 1 unit
billing.charge("event-name", 5);   // Charge 5 units
```

Configure events in MCPize dashboard: **Monetize > Events**.

## Subscriber Identity

MCPize gateway injects identity headers on every proxied request to your server:

| Header | When Present | Use Case |
|--------|-------------|----------|
| `X-MCPize-User-ID` | Always (authenticated requests) | Per-user rate limiting, analytics, state |
| `X-MCPize-Subscription-ID` | Paid subscriptions only | Tier-based access, billing reconciliation |

**Pattern A — Express middleware** (rate limiting, logging):

```typescript
app.use((req, _res, next) => {
  const userId = req.headers["x-mcpize-user-id"];
  const subscriptionId = req.headers["x-mcpize-subscription-id"];
  // rate limit, log, personalize...
  next();
});
```

**Pattern B — Inside tool handler** via billing helper:

```typescript
const { userId, subscriptionId } = billing.getSubscriber();
```

## Testing

```bash
npm test                                  # Run unit tests
npx @anthropic-ai/mcp-inspector          # Interactive MCP testing
```

Connect to `http://localhost:8080/mcp` to test tools interactively.

## Deployment

```bash
mcpize deploy
```

## License

MIT
