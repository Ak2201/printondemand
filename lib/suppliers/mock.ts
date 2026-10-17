import type { SupplierAdapter } from "./types";

/** Dev adapter: pretends the supplier accepted the order. */
export const mockSupplier: SupplierAdapter = {
  name: "mock",
  async createOrder(input) {
    return { supplierOrderId: `mock_${input.externalId.slice(0, 8)}`, status: "accepted" };
  },
};
