import type { Product } from "@/types";

// Amounts are in paise (1 INR = 100 paise). Prices are GST-inclusive.
// Mirrors supabase/migrations/0001_init.sql seed; costs are placeholders until supplier samples are priced.
const apparel = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#111827" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Red", hex: "#dc2626" },
];
const sizes = ["S", "M", "L", "XL", "XXL"];

export const products: Product[] = [
  { id: "tshirt", name: "Classic T-Shirt", category: "Apparel", baseCost: 25000, shipping: 6000, price: 69900, gstRate: 5, colors: apparel, sizes, views: ["front", "back"], emoji: "👕" },
  { id: "hoodie", name: "Pullover Hoodie", category: "Apparel", baseCost: 55000, shipping: 8000, price: 149900, gstRate: 12, colors: apparel, sizes, views: ["front", "back"], emoji: "🧥" },
  { id: "mug", name: "Ceramic Mug 11oz", category: "Drinkware", baseCost: 15000, shipping: 7000, price: 39900, gstRate: 18, colors: [{ name: "White", hex: "#ffffff" }, { name: "Black", hex: "#111827" }], views: ["wrap"], emoji: "☕" },
  { id: "phonecase", name: "Phone Case", category: "Accessories", baseCost: 18000, shipping: 6000, price: 49900, gstRate: 18, colors: [{ name: "Clear", hex: "#e5e7eb" }, { name: "Black", hex: "#111827" }], views: ["back"], emoji: "📱" },
  { id: "canvas", name: "Canvas Print 12x16", category: "Wall Art", baseCost: 40000, shipping: 9000, price: 99900, gstRate: 18, colors: [{ name: "White", hex: "#ffffff" }], views: ["front"], emoji: "🖼️" },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
