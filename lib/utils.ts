import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
/** Format rupees. */
export const money = (rupees: number) => inr.format(rupees);
/** Format paise. */
export const moneyPaise = (paise: number) => inr.format(paise / 100);
