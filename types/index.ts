export type ProductView = "front" | "back" | "wrap";

/** All money fields are integer paise. */
export interface Product {
  id: string;
  name: string;
  category: string;
  baseCost: number;
  shipping: number;
  price: number; // GST-inclusive selling price
  gstRate: number;
  colors: { name: string; hex: string }[];
  sizes?: string[];
  views: ProductView[];
  emoji: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  color: string;
  size?: string;
  price: number; // display only; server recomputes
  designPath?: string; // Supabase Storage path of the print-ready PNG
  quantity: number;
  preview?: string;
}

export interface Address {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

/** Inputs in rupees for the calculator UI. */
export interface PricingInput {
  baseCost: number;
  shipping: number;
  sellingPrice: number;
  gstRate: number;
  monthlyUnits: number;
  adSpend: number;
  feePercent: number;
}

export interface PricingResult {
  gstAmount: number;
  profitPerUnit: number;
  margin: number;
  monthlyProfit: number;
  roi: number;
  breakEvenUnits: number;
}
