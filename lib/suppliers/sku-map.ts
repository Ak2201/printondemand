// Maps our catalog (productId + color + size) to the supplier's variant/product ids.
// Fill this in from the Printrove merchant panel / product API after sample orders (Phase B).
// Key format: `${productId}|${colorName}|${size ?? "-"}`.
export const printroveVariants: Record<string, { productId: number; variantId: number }> = {
  // "tshirt|White|M": { productId: 0, variantId: 0 },
};

export const skuKey = (productId: string, color: string, size?: string) => `${productId}|${color}|${size ?? "-"}`;
