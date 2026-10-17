import type { PricingInput, PricingResult } from "@/types";

export function calculatePricing(i: PricingInput): PricingResult {
  const fees = i.sellingPrice * (i.feePercent / 100) + i.feeFixed;
  const profitPerUnit = i.sellingPrice - i.baseCost - i.shipping - fees;
  const margin = i.sellingPrice > 0 ? (profitPerUnit / i.sellingPrice) * 100 : 0;
  const monthlyProfit = profitPerUnit * i.monthlyUnits - i.adSpend;
  const unitCost = i.baseCost + i.shipping + fees;
  const invested = unitCost * i.monthlyUnits + i.adSpend;
  const roi = invested > 0 ? (monthlyProfit / invested) * 100 : 0;
  const breakEvenUnits = profitPerUnit > 0 ? Math.ceil(i.adSpend / profitPerUnit) : Infinity;
  return { profitPerUnit, margin, monthlyProfit, roi, breakEvenUnits };
}
