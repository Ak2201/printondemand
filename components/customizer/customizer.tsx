"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { fabric as FabricNS } from "fabric";
import { Download, ImagePlus, ShoppingCart, Trash2, Type } from "lucide-react";
import { getProduct, products } from "@/lib/products";
import { cn, money } from "@/lib/utils";
import { useCart } from "@/store/cart";
import type { ProductView } from "@/types";

const SIZE = 500;
const EXPORT_MULTIPLIER = 4; // 500px -> 2000px hi-res PNG
const printArea: Record<ProductView, { w: number; h: number }> = {
  front: { w: 280, h: 340 },
  back: { w: 280, h: 340 },
  wrap: { w: 420, h: 180 },
};

type Fabric = typeof FabricNS;

export function Customizer() {
  const params = useSearchParams();
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<FabricNS.Canvas | null>(null);
  const fabricRef = useRef<Fabric | null>(null);
  const designs = useRef<Partial<Record<ProductView, string>>>({}); // per-view JSON

  const [productId, setProductId] = useState(params.get("product") ?? "tshirt");
  const product = getProduct(productId) ?? products[0];
  const [view, setView] = useState<ProductView>(product.views[0]);
  const [color, setColor] = useState(product.colors[0].hex);
  const [textColor, setTextColor] = useState("#4f46e5");
  const [text, setText] = useState("Your text");
  const [selected, setSelected] = useState<FabricNS.Object | null>(null);
  const [scale, setScale] = useState(1);
  const [angle, setAngle] = useState(0);
  const add = useCart((s) => s.add);

  const area = printArea[view];

  const drawGuide = useCallback((c: FabricNS.Canvas, f: Fabric) => {
    const a = printArea[view];
    c.clipPath = undefined;
    const guide = new f.Rect({
      left: (SIZE - a.w) / 2, top: (SIZE - a.h) / 2, width: a.w, height: a.h,
      fill: "transparent", stroke: "#94a3b8", strokeDashArray: [6, 4],
      selectable: false, evented: false, excludeFromExport: true,
    });
    (guide as any).isGuide = true;
    c.add(guide);
    guide.sendToBack();
  }, [view]);

  // init canvas once
  useEffect(() => {
    let disposed = false;
    (async () => {
      const { fabric } = await import("fabric");
      if (disposed || !canvasEl.current) return;
      fabricRef.current = fabric;
      const c = new fabric.Canvas(canvasEl.current, { width: SIZE, height: SIZE, preserveObjectStacking: true });
      canvasRef.current = c;
      const sync = () => {
        const o = c.getActiveObject() ?? null;
        setSelected(o);
        if (o) { setScale(o.scaleX ?? 1); setAngle(Math.round(o.angle ?? 0)); }
      };
      c.on("selection:created", sync);
      c.on("selection:updated", sync);
      c.on("selection:cleared", () => setSelected(null));
      c.on("object:modified", sync);
      drawGuide(c, fabric);
    })();
    return () => { disposed = true; canvasRef.current?.dispose(); canvasRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // switch product -> reset
  const pickProduct = (id: string) => {
    const p = getProduct(id)!;
    designs.current = {};
    setProductId(id);
    setColor(p.colors[0].hex);
    switchView(p.views[0], true);
  };

  const switchView = (next: ProductView, reset = false) => {
    const c = canvasRef.current, f = fabricRef.current;
    if (c && f) {
      if (!reset) designs.current[view] = JSON.stringify(c.toJSON(["excludeFromExport", "isGuide"]));
      c.clear();
      const saved = reset ? undefined : designs.current[next];
      if (saved) c.loadFromJSON(saved, () => c.renderAll());
      else drawGuide(c, f);
    }
    setView(next);
    setSelected(null);
  };

  // guide redraw handled in switchView; ensure guide exists after first load
  const centerAdd = (o: FabricNS.Object) => {
    const c = canvasRef.current!;
    o.set({ left: SIZE / 2, top: SIZE / 2, originX: "center", originY: "center" });
    c.add(o); c.setActiveObject(o); c.requestRenderAll();
  };

  const addText = () => {
    const f = fabricRef.current; if (!f) return;
    centerAdd(new f.IText(text || "Text", { fontFamily: "Arial", fontSize: 40, fill: textColor, fontWeight: "bold" }));
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; const f = fabricRef.current;
    if (!file || !f) return;
    const reader = new FileReader();
    reader.onload = () => {
      f.Image.fromURL(reader.result as string, (img: FabricNS.Image) => {
        img.scaleToWidth(Math.min(area.w * 0.8, img.width ?? 200));
        centerAdd(img);
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyTransform = (s: number, a: number) => {
    if (!selected) return;
    selected.set({ scaleX: s, scaleY: s, angle: a });
    selected.setCoords(); canvasRef.current?.requestRenderAll();
  };

  const recolor = (hex: string) => {
    setTextColor(hex);
    if (selected && "text" in selected) { selected.set("fill", hex); canvasRef.current?.requestRenderAll(); }
  };

  const remove = () => {
    if (!selected) return;
    canvasRef.current?.remove(selected); setSelected(null);
  };

  const exportPng = (): string | undefined =>
    canvasRef.current?.toDataURL({ format: "png", multiplier: EXPORT_MULTIPLIER, left: (SIZE - area.w) / 2, top: (SIZE - area.h) / 2, width: area.w, height: area.h });

  const download = () => {
    const url = exportPng(); if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = `${product.id}-${view}-design.png`; a.click();
  };

  const addToCart = () => {
    const small = canvasRef.current?.toDataURL({ format: "png", multiplier: 0.5 });
    add({ id: `${product.id}-${color}-${Date.now()}`, productId: product.id, name: product.name, color, price: product.suggestedPrice, quantity: 1, preview: small });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <button key={p.id} onClick={() => pickProduct(p.id)}
              className={cn("rounded-full border px-3 py-1 text-sm", p.id === productId ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-slate-800" : "border-slate-300 dark:border-slate-700")}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {product.views.map((v) => (
            <button key={v} onClick={() => v !== view && switchView(v)}
              className={cn("rounded px-3 py-1 text-sm capitalize", v === view ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800")}>{v}</button>
          ))}
        </div>
        <div className="max-w-full overflow-auto rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
          <div style={{ width: SIZE, height: SIZE, background: color }}>
            <canvas ref={canvasEl} />
          </div>
        </div>
      </div>

      <aside className="space-y-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Product color</h2>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <button key={c.hex} title={c.name} onClick={() => setColor(c.hex)} style={{ background: c.hex }}
                className={cn("h-8 w-8 rounded-full border-2", color === c.hex ? "border-brand-600" : "border-slate-300")} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Add</h2>
          <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-slate-400 p-2 text-sm">
            <ImagePlus size={16} /> Upload image
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
          <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" />
          <div className="flex items-center gap-2">
            <input type="color" value={textColor} onChange={(e) => recolor(e.target.value)} aria-label="Text color" className="h-9 w-10" />
            <button onClick={addText} className="flex flex-1 items-center justify-center gap-2 rounded bg-slate-100 p-2 text-sm dark:bg-slate-800"><Type size={16} /> Add text</button>
          </div>
        </div>
        <div className={cn("space-y-2", !selected && "pointer-events-none opacity-40")}>
          <h2 className="text-sm font-semibold">Selected object</h2>
          <label className="block text-xs">Scale
            <input type="range" min={0.1} max={4} step={0.05} value={scale} className="w-full"
              onChange={(e) => { const s = +e.target.value; setScale(s); applyTransform(s, angle); }} />
          </label>
          <label className="block text-xs">Rotate ({angle}°)
            <input type="range" min={0} max={360} value={angle} className="w-full"
              onChange={(e) => { const a = +e.target.value; setAngle(a); applyTransform(scale, a); }} />
          </label>
          <button onClick={remove} className="flex items-center gap-2 text-sm text-red-600"><Trash2 size={14} /> Delete</button>
        </div>
        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="flex justify-between text-sm"><span>Price</span><strong>{money(product.suggestedPrice)}</strong></div>
          <button onClick={addToCart} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 p-2.5 text-white hover:bg-brand-700"><ShoppingCart size={16} /> Add to cart</button>
          <button onClick={download} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700"><Download size={16} /> Export hi-res PNG</button>
        </div>
      </aside>
    </div>
  );
}
