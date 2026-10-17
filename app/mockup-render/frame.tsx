"use client";
import { useEffect, useState } from "react";
import { ProductMockup } from "@/components/mockup/product-mockup";

export function RenderFrame({ productId, color, view, design }: { productId: string; color: string; view: "front" | "back" | "wrap"; design?: string }) {
  const [ready, setReady] = useState(!design);
  useEffect(() => {
    if (!design) return;
    const img = new Image();
    img.onload = img.onerror = () => setReady(true);
    img.src = design;
  }, [design]);
  return (
    <div id="frame" data-ready={ready ? "1" : "0"} style={{ position: "fixed", top: 0, left: 0, zIndex: 99999, width: 900, height: 900, background: "linear-gradient(#f8fafc,#e2e8f0)" }}>
      <ProductMockup productId={productId} color={color} view={view} designSrc={design} className="h-full w-full" />
    </div>
  );
}
