export type ProductView = "front" | "back" | "wrap";

export interface Product {
  id: string;
  name: string;
  category: string;
  baseCost: number; // supplier cost per unit (USD)
  shipping: number;
  suggestedPrice: number;
  colors: { name: string; hex: string }[];
  views: ProductView[];
  emoji: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  color: string;
  size?: string;
  price: number;
  quantity: number;
  preview?: string; // data URL of design
}

export interface PricingInput {
  baseCost: number;
  shipping: number;
  sellingPrice: number;
  monthlyUnits: number;
  adSpend: number;
  feePercent: number;
  feeFixed: number;
}

export interface PricingResult {
  profitPerUnit: number;
  margin: number;
  monthlyProfit: number;
  roi: number;
  breakEvenUnits: number;
}
