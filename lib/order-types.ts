import type { Address } from "@/types";

export type OrderStatus = "pending" | "paid" | "in_production" | "shipped" | "delivered" | "cancelled" | string;

export interface OrderLine {
  productId: string;
  color: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  designPath?: string;
  designSlug?: string;
}

export interface ShipmentInfo {
  supplier: string;
  supplierOrderId?: string | null;
  status?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  error?: string | null;
  updatedAt: string;
}

/** Normalised order used by admin pages, public status and fulfilment, regardless of storage backend. */
export interface StoredOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  address: Address;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  razorpayOrderId: string;
  shipment?: ShipmentInfo | null;
}
