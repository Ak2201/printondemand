import Link from "next/link";
import { ProductMockup } from "@/components/mockup/product-mockup";
import { getProduct } from "@/lib/products";
import type { CatalogDesign } from "@/lib/design-catalog";
import { moneyPaise } from "@/lib/utils";

export function DesignCard({ design, productId = "tshirt" }: { design: CatalogDesign; productId?: string }) {
  const p = getProduct(productId)!;
  const color = p.colors.find((c) => c.name === design.defaultColor) ?? p.colors[0];
  return (
    <Link href={`/designs/${design.slug}`} className="group block overflow-hidden rounded-xl border border-slate-200 transition hover:shadow-lg dark:border-slate-800">
      <div className="bg-gradient-to-b from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <ProductMockup productId={productId} color={color.hex} view="front" designSrc={design.src} className="w-full transition group-hover:scale-[1.03]" />
      </div>
      <div className="p-3">
        <div className="font-medium">{design.name}</div>
        <div className="text-xs text-slate-500">{design.tagline}</div>
        <div className="mt-1 text-sm font-semibold">{moneyPaise(p.price)}</div>
      </div>
    </Link>
  );
}
