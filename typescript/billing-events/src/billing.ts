import { AsyncLocalStorage } from "node:async_hooks";
import { Response } from "express";

/**
 * MCPize Billing Helper
 *
 * Uses AsyncLocalStorage to isolate charges and subscriber identity per-request,
 * preventing race conditions when Cloud Run handles concurrent requests in a single container.
 *
 * @example
 * ```typescript
 * import { MCPizeBilling } from "./billing";
 *
 * const billing = new MCPizeBilling();
 *
 * // In your tool handler:
 * server.registerTool("analyze", { ... }, async (params) => {
 *   const result = await performAnalysis(params.data);
 *
 *   // Charge for the analysis event
 *   billing.charge("deep-analysis");
 *
 *   // Get subscriber identity (injected by MCPize gateway)
 *   const { userId } = billing.getSubscriber();
 *
 *   return { content: [{ type: "text", text: result }] };
 * });
 *
 * // Apply middleware (reads identity headers + adds charge header to response)
 * app.post("/mcp", billing.middleware(), async (req, res) => { ... });
 * ```
 */

interface ChargeRequest {
  event: string;
  count: number;
}

interface BillingContext {
  pendingCharge: ChargeRequest | null;
  subscriberId: string | null;
  subscriptionId: string | null;
}

const billingStorage = new AsyncLocalStorage<BillingContext>();

export class MCPizeBilling {
  /**
   * Queue a charge for a billing event (stored per-request via AsyncLocalStorage)
   * @param event - The event code (must be configured in MCPize dashboard)
   * @param count - Number of units to charge (default: 1)
   */
  charge(event: string, count: number = 1): void {
    if (count < 1 || !Number.isInteger(count)) {
      throw new Error("Count must be a positive integer");
    }

    const ctx = billingStorage.getStore();
    if (ctx) {
      // Only one charge per request - last one wins
      ctx.pendingCharge = { event, count };
    }
  }

  /**
   * Get the pending charge for the current request (if any)
   */
  getPendingCharge(): ChargeRequest | null {
    const ctx = billingStorage.getStore();
    return ctx?.pendingCharge ?? null;
  }

  /**
   * Get subscriber identity for the current request (injected by MCPize gateway)
   * @returns userId (always present for authenticated requests) and subscriptionId (paid only)
   */
  getSubscriber(): { userId: string | null; subscriptionId: string | null } {
    const ctx = billingStorage.getStore();
    return {
      userId: ctx?.subscriberId ?? null,
      subscriptionId: ctx?.subscriptionId ?? null,
    };
  }

  /**
   * Express middleware that wraps each request in its own billing context
   * and adds the X-MCPize-Charge header before the response is sent.
   * @returns Express middleware function
   */
  middleware() {
    return (req: any, res: Response, next: () => void) => {
      billingStorage.run({
        pendingCharge: null,
        subscriberId: req.headers["x-mcpize-user-id"] ?? null,
        subscriptionId: req.headers["x-mcpize-subscription-id"] ?? null,
      }, () => {
        const originalEnd = res.end.bind(res);

        res.end = ((...args: any[]) => {
          const ctx = billingStorage.getStore();
          if (!res.headersSent && ctx?.pendingCharge) {
            res.setHeader(
              "X-MCPize-Charge",
              JSON.stringify(ctx.pendingCharge)
            );
          }
          return originalEnd(...args);
        }) as typeof res.end;

        next();
      });
    };
  }
}

/**
 * Create a billing instance for use in your MCP server
 */
export function createBilling(): MCPizeBilling {
  return new MCPizeBilling();
}

/**
 * Helper to directly set the charge header on a response
 * @param res - Express response object
 * @param event - Event code to charge
 * @param count - Number of units (default: 1)
 */
export function setChargeHeader(res: Response, event: string, count: number = 1): void {
  res.setHeader(
    "X-MCPize-Charge",
    JSON.stringify({ event, count })
  );
}
