"use client";
import { useId } from "react";
import { CANVAS, getPrintArea } from "@/lib/mockups";
import type { ProductView } from "@/types";

interface Props {
  productId: string;
  color: string; // hex
  view?: ProductView;
  designSrc?: string;
  /** base = product only, shade = folds/highlights only (for stacking under/over the editor), all = everything */
  layer?: "all" | "base" | "shade";
  className?: string;
}

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

const TEE_FRONT = "M170 80 L125 100 L58 152 L94 204 L135 180 L135 440 L365 440 L365 180 L406 204 L442 152 L375 100 L330 80 Q250 132 170 80 Z";
const TEE_BACK = "M170 80 L125 100 L58 152 L94 204 L135 180 L135 440 L365 440 L365 180 L406 204 L442 152 L375 100 L330 80 Q250 100 170 80 Z";
const HOODIE = "M165 98 L108 122 L52 335 L100 350 L135 235 L135 442 L365 442 L365 235 L400 350 L448 335 L392 122 L335 98 Q250 146 165 98 Z";

export function ProductMockup({ productId, color, view = "front", designSrc, layer = "all", className }: Props) {
  const uid = useId().replace(/:/g, "");
  const a = getPrintArea(productId, view);
  const light = isLight(color);
  const stroke = light ? "rgba(0,0,0,.28)" : "rgba(255,255,255,.22)";
  const showBase = layer !== "shade";
  const showShade = layer !== "base";
  const showDesign = layer === "all" && designSrc;

  let silhouette: React.ReactNode;
  let details: React.ReactNode = null;
  let foldPath = "";
  if (productId === "tshirt") {
    const d = view === "back" ? TEE_BACK : TEE_FRONT;
    foldPath = d;
    silhouette = <path d={d} fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />;
    details = <path d={view === "back" ? "M170 80 Q250 100 330 80" : "M170 80 Q250 132 330 80"} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" />;
  } else if (productId === "hoodie") {
    foldPath = HOODIE;
    silhouette = (
      <>
        <path d="M178 96 Q170 36 250 32 Q330 36 322 96 Q250 156 178 96 Z" fill={color} stroke={stroke} strokeWidth="2" />
        <path d={HOODIE} fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </>
    );
    details = view === "front" ? (
      <>
        <path d="M178 96 Q250 156 322 96" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <path d="M232 128 L228 200 M268 128 L272 200" stroke={light ? "#9ca3af" : "#e5e7eb"} strokeWidth="4" strokeLinecap="round" />
        <path d="M190 360 L210 330 L290 330 L310 360 L310 420 L190 420 Z" fill="none" stroke={stroke} strokeWidth="2" />
        <path d="M135 425 H365" stroke={stroke} strokeWidth="2" />
      </>
    ) : <path d="M135 425 H365" stroke={stroke} strokeWidth="2" />;
  } else if (productId === "mug") {
    foldPath = "M90 120 H370 V390 Q370 402 358 402 H102 Q90 402 90 390 Z";
    silhouette = (
      <>
        <path d="M370 170 H400 Q452 170 452 235 Q452 300 400 300 H370" fill="none" stroke={color} strokeWidth="26" strokeLinecap="round" />
        <path d="M370 170 H400 Q452 170 452 235 Q452 300 400 300 H370" fill="none" stroke={stroke} strokeWidth="2" transform="translate(0 0)" opacity=".6" />
        <path d={foldPath} fill={color} stroke={stroke} strokeWidth="2" />
        <ellipse cx="230" cy="120" rx="140" ry="14" fill={light ? "#e5e7eb" : "#374151"} stroke={stroke} strokeWidth="2" />
      </>
    );
  } else if (productId === "phonecase") {
    foldPath = "M170 50 H330 Q356 50 356 76 V424 Q356 450 330 450 H170 Q144 450 144 424 V76 Q144 50 170 50 Z";
    silhouette = (
      <>
        <path d={foldPath} fill={color} stroke={stroke} strokeWidth="2.5" />
        <rect x="160" y="64" width="54" height="54" rx="14" fill="#111827" opacity=".85" />
        <circle cx="178" cy="82" r="9" fill="#1f2937" stroke="#6b7280" /><circle cx="196" cy="100" r="9" fill="#1f2937" stroke="#6b7280" />
      </>
    );
  } else {
    foldPath = "M100 50 H400 V450 H100 Z";
    silhouette = (
      <>
        <rect x="108" y="58" width="300" height="400" fill="rgba(0,0,0,.22)" />
        <rect x="100" y="50" width="300" height="400" fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="2" />
      </>
    );
  }

  return (
    <svg viewBox={`0 0 ${CANVAS} ${CANVAS}`} className={className} role="img" aria-label={`${productId} mockup`} style={{ display: "block" }}>
      <defs>
        <clipPath id={`${uid}-area`}><rect x={a.x} y={a.y} width={a.w} height={a.h} /></clipPath>
        <clipPath id={`${uid}-shape`}><path d={foldPath} /></clipPath>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".25" stopColor="#000" stopOpacity="0" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".26" />
        </linearGradient>
        <linearGradient id={`${uid}-vert`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".1" /><stop offset="1" stopColor="#000" stopOpacity=".16" />
        </linearGradient>
      </defs>
      {showBase && (
        <g>
          <ellipse cx="250" cy="465" rx="150" ry="12" fill="rgba(0,0,0,.12)" />
          {silhouette}
          {details}
        </g>
      )}
      {showDesign && (
        <image href={designSrc} x={a.x} y={a.y} width={a.w} height={a.h} preserveAspectRatio="xMidYMid meet" clipPath={`url(#${uid}-area)`} />
      )}
      {showShade && (
        <g clipPath={`url(#${uid}-shape)`} style={{ mixBlendMode: "multiply" }} pointerEvents="none">
          <rect x="0" y="0" width={CANVAS} height={CANVAS} fill={`url(#${uid}-shade)`} />
          <rect x="0" y="0" width={CANVAS} height={CANVAS} fill={`url(#${uid}-vert)`} />
          {(productId === "tshirt" || productId === "hoodie") && (
            <g fill="none" stroke="rgba(0,0,0,.10)" strokeWidth="6" strokeLinecap="round">
              <path d="M190 300 Q210 330 200 380" /><path d="M300 250 Q285 300 305 360" /><path d="M150 195 Q160 230 150 260" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
