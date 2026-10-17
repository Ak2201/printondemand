import type { Product } from "@/types";

const apparel = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#111827" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Red", hex: "#dc2626" },
];

export const products: Product[] = [
  { id: "tshirt", name: "Classic T-Shirt", category: "Apparel", baseCost: 8.5, shipping: 4.0, suggestedPrice: 24.99, colors: apparel, views: ["front", "back"], emoji: "👕" },
  { id: "hoodie", name: "Pullover Hoodie", category: "Apparel", baseCost: 18.0, shipping: 5.5, suggestedPrice: 49.99, colors: apparel, views: ["front", "back"], emoji: "🧥" },
  { id: "mug", name: "Ceramic Mug 11oz", category: "Drinkware", baseCost: 5.5, shipping: 4.5, suggestedPrice: 16.99, colors: [{ name: "White", hex: "#ffffff" }, { name: "Black", hex: "#111827" }], views: ["wrap"], emoji: "☕" },
  { id: "phonecase", name: "Phone Case", category: "Accessories", baseCost: 7.0, shipping: 3.5, suggestedPrice: 19.99, colors: [{ name: "Clear", hex: "#e5e7eb" }, { name: "Black", hex: "#111827" }], views: ["back"], emoji: "📱" },
  { id: "canvas", name: "Canvas Print 12x16", category: "Wall Art", baseCost: 14.0, shipping: 6.0, suggestedPrice: 39.99, colors: [{ name: "White", hex: "#ffffff" }], views: ["front"], emoji: "🖼️" },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
