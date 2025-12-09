import { Response } from "express";

/**
 * MCPize Billing Helper
 *
 * This helper allows you to charge for custom billing events when your MCP server
 * is hosted through MCPize gateway. The gateway processes the X-MCPize-Charge header
 * and records charges based on your configured event pricing.
 *
 * @example
 * ```typescript
 * import { MCPizeBilling } from "./billing";
 *
 * const billing = new MCPizeBilling();
 *
 * // In your tool handler:
 * server.registerTool("analyze", { ... }, async (params, { res }) => {
 *   const result = await performAnalysis(params.data);
 *
 *   // Charge for the analysis event
 *   billing.charge("deep-analysis");
 *
 *   return { content: [{ type: "text", text: result }] };
 * });
 *
 * // Apply middleware to add header to response
 * app.post("/mcp", billing.middleware(), async (req, res) => { ... });
 * ```
 */

interface ChargeRequest {
  event: string;
  count: number;
}

export class MCPizeBilling {
  private pendingCharge: ChargeRequest | null = null;

  /**
   * Queue a charge for a billing event
   * @param event - The event code (must be configured in MCPize dashboard)
   * @param count - Number of units to charge (default: 1)
   */
  charge(event: string, count: number = 1): void {
    if (count < 1 || !Number.isInteger(count)) {
      throw new Error("Count must be a positive integer");
    }

    // Only one charge per request - last one wins
    this.pendingCharge = { event, count };
  }

  /**
   * Get the pending charge (if any)
   */
  getPendingCharge(): ChargeRequest | null {
    return this.pendingCharge;
  }

  /**
   * Clear the pending charge
   */
  clearCharge(): void {
    this.pendingCharge = null;
  }

  /**
   * Apply the charge header to a response
   * @param res - Express response object
   */
  applyToResponse(res: Response): void {
    if (this.pendingCharge) {
      res.setHeader(
        "X-MCPize-Charge",
        JSON.stringify(this.pendingCharge)
      );
      this.pendingCharge = null;
    }
  }

  /**
   * Express middleware that adds the charge header to responses
   * @returns Express middleware function
   */
  middleware() {
    return (_req: any, res: Response, next: () => void) => {
      // Store original end function
      const originalEnd = res.end.bind(res);

      // Override end to add header before sending
      res.end = ((...args: any[]) => {
        this.applyToResponse(res);
        return originalEnd(...args);
      }) as typeof res.end;

      next();
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
