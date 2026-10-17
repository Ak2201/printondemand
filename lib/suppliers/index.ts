import { mockSupplier } from "./mock";
import { printrove } from "./printrove";
import type { SupplierAdapter } from "./types";

/** Returns null when no supplier is usable (production without credentials): orders stay `paid` for manual fulfilment. */
export function getSupplier(): SupplierAdapter | null {
  const provider = process.env.POD_PROVIDER ?? "printrove";
  if (provider === "printrove" && process.env.PRINTROVE_API_KEY) return printrove;
  if (process.env.NODE_ENV !== "production") return mockSupplier;
  return null;
}
