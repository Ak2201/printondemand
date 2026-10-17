import type { Address } from "@/types";

export interface FulfilmentItem {
  productId: string;
  color: string;
  size?: string;
  quantity: number;
  designUrl: string | null; // time-limited URL the supplier can download
}

export interface SupplierOrderInput {
  externalId: string; // our order id; used for idempotency/reference
  address: Address;
  items: FulfilmentItem[];
}

export interface SupplierOrderResult {
  supplierOrderId: string;
  status: string;
}

export interface SupplierAdapter {
  name: string;
  createOrder(input: SupplierOrderInput): Promise<SupplierOrderResult>;
}
