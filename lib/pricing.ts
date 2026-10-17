import type { PricingInput, PricingResult } from "@/types";

// Razorpay domestic: 2% platform fee + 18% GST on the fee = 2.36% (verify on razorpay.com/pricing).
export const RAZORPAY_FEE_PERCENT = 2.36;

/** Rupee inputs. sellingPrice is GST-inclusive; GST is remitted to the government, so it is not profit. */
export function calculatePricing(i: PricingInput): PricingResult {
  const gstAmount = i.sellingPrice - i.sellingPrice / (1 + i.gstRate / 100);
  const netRevenue = i.sellingPrice - gstAmount;
  const fees = i.sellingPrice * (i.feePercent / 100);
  const profitPerUnit = netRevenue - i.baseCost - i.shipping - fees;
  const margin = netRevenue > 0 ? (profitPerUnit / netRevenue) * 100 : 0;
  const monthlyProfit = profitPerUnit * i.monthlyUnits - i.adSpend;
  const invested = (i.baseCost + i.shipping) * i.monthlyUnits + i.adSpend;
  const roi = invested > 0 ? (monthlyProfit / invested) * 100 : 0;
  const breakEvenUnits = profitPerUnit > 0 ? Math.ceil(i.adSpend / profitPerUnit) : Infinity;
  return { gstAmount, profitPerUnit, margin, monthlyProfit, roi, breakEvenUnits };
}
