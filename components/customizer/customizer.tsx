"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { fabric as FabricNS } from "fabric";
import { AlertTriangle, ArrowDown, ArrowUp, Copy, Download, Eye, FlipHorizontal, ImagePlus, ShoppingCart, Trash2, Type, UploadCloud } from "lucide-react";
import { ProductMockup } from "@/components/mockup/product-mockup";
import { CANVAS, getPrintArea } from "@/lib/mockups";
import { getProduct, products } from "@/lib/products";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn, moneyPaise } from "@/lib/utils";
import { useCart } from "@/store/cart";
import type { ProductView } from "@/types";

type Fabric = typeof FabricNS;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_BYTES = 15 * 1024 * 1024;
const EXPORT_WIDTH = 2400; // target print file width in px

export function Customizer() {
  const params = useSearchParams();
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<FabricNS.Canvas | null>(null);
  const fabricRef = useRef<Fabric | null>(null);
  const designs = useRef<Partial<Record<ProductView, string>>>({});
  const frameRef = useRef<HTMLDivElement>(null);

  const initialProduct = getProduct(params.get("product") ?? "") ?? products[0];
  const [productId, setProductId] = useState(initialProduct.id);
  const product = getProduct(productId) ?? products[0];
  const [view, setView] = useState<ProductView>(initialProduct.views[0]);
  const initialColor = initialProduct.colors.find((c) => c.name.toLowerCase() === (params.get("color") ?? "").toLowerCase()) ?? initialProduct.colors[0];
  const [color, setColor] = useState(initialColor.hex);
  const [textColor, setTextColor] = useState("#4f46e5");
  const [text, setText] = useState("Your text");
  const [size, setSize] = useState("M");
  const [selected, setSelected] = useState<FabricNS.Object | null>(null);
  const [scale, setScale] = useState(1);
  const [angle, setAngle] = useState(0);
  const [dpi, setDpi] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [fit, setFit] = useState(1);
  const [count, setCount] = useState(0);
  const add = useCart((s) => s.add);

  const area = getPrintArea(productId, view);
  const areaRef = useRef(area);
  areaRef.current = area;

  const applyClip = useCallback(() => {
    const c = canvasRef.current, f = fabricRef.current; if (!c || !f) return;
    const a = areaRef.current;
    c.clipPath = new f.Rect({ left: a.x, top: a.y, width: a.w, height: a.h, absolutePositioned: true });
    c.requestRenderAll();
  }, []);

  const computeDpi = useCallback((o: FabricNS.Object | null) => {
    if (!o || o.type !== "image") { setDpi(null); return; }
    const img = o as FabricNS.Image;
    const natural = img.getOriginalSize().width;
    const printedIn = (img.getScaledWidth() / areaRef.current.w) * getPrintArea(productIdRef.current, viewRef.current).widthIn;
    setDpi(printedIn > 0 ? Math.round(natural / printedIn) : null);
  }, []);
  const productIdRef = useRef(productId); productIdRef.current = productId;
  const viewRef = useRef(view); viewRef.current = view;

  const sync = useCallback(() => {
    const o = canvasRef.current?.getActiveObject() ?? null;
    setSelected(o);
    if (o) { setScale(o.scaleX ?? 1); setAngle(Math.round(o.angle ?? 0)); }
    computeDpi(o);
  }, [computeDpi]);

  const centerAdd = useCallback((o: FabricNS.Object) => {
    const c = canvasRef.current!; const a = areaRef.current;
    o.set({ left: a.x + a.w / 2, top: a.y + a.h / 2, originX: "center", originY: "center" });
    c.add(o); c.setActiveObject(o); c.requestRenderAll(); sync();
  }, [sync]);

  const addImageFromUrl = useCallback((url: string, opts?: { cover?: boolean }) => {
    const f = fabricRef.current; if (!f) return;
    f.Image.fromURL(url, (img: FabricNS.Image) => {
      if (!img.width) { setNotice("That image could not be read."); return; }
      const a = areaRef.current;
      const s = Math.min((a.w * 0.9) / img.width, (a.h * 0.9) / img.height!);
      img.scale(opts?.cover ? Math.max(a.w / img.width, a.h / img.height!) : s);
      centerAdd(img);
    }, { crossOrigin: "anonymous" });
  }, [centerAdd]);

  const handleFile = useCallback((file: File | undefined | null) => {
    if (!file) return;
    setNotice("");
    if (!ACCEPT.includes(file.type)) { setNotice("Please choose a PNG, JPG, WebP, GIF or SVG image."); return; }
    if (file.size > MAX_BYTES) { setNotice("That file is over 15 MB. Please choose a smaller image."); return; }
    const reader = new FileReader();
    reader.onload = () => addImageFromUrl(reader.result as string);
    reader.onerror = () => setNotice("Could not read that file.");
    reader.readAsDataURL(file);
  }, [addImageFromUrl]);

  // init canvas once
  useEffect(() => {
    let disposed = false;
    (async () => {
      const { fabric } = await import("fabric");
      if (disposed || !canvasEl.current) return;
      fabricRef.current = fabric;
      const c = new fabric.Canvas(canvasEl.current, { width: CANVAS, height: CANVAS, preserveObjectStacking: true, enableRetinaScaling: false });
      canvasRef.current = c;
      c.on("selection:created", sync); c.on("selection:updated", sync);
      c.on("selection:cleared", () => { setSelected(null); setDpi(null); });
      c.on("object:modified", sync); c.on("object:scaling", sync);
      const recount = () => setCount(c.getObjects().length);
      c.on("object:added", recount); c.on("object:removed", recount);
      applyClip();
      setReady(true);
      const slug = params.get("design");
      if (slug && /^[a-z0-9-]+$/.test(slug)) {
        fetch(`/designs/${slug}.svg`).then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
          .then((b) => { const rd = new FileReader(); rd.onload = () => addImageFromUrl(rd.result as string); rd.readAsDataURL(b); })
          .catch(() => setNotice(`Design “${slug}” was not found — start from scratch below.`));
      }
    })();
    return () => { disposed = true; canvasRef.current?.dispose(); canvasRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fit to container width (mobile)
  useEffect(() => {
    const el = frameRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1, el.clientWidth / CANVAS)));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // paste images
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith("image/"));
      if (f) { e.preventDefault(); handleFile(f); }
    };
    window.addEventListener("paste", onPaste); return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  // keyboard delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && canvasRef.current?.getActiveObject()) {
        const o = canvasRef.current.getActiveObject()!;
        if ((o as FabricNS.IText).isEditing) return;
        canvasRef.current.remove(o); setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { applyClip(); }, [productId, view, applyClip]);

  const switchView = (next: ProductView, reset = false) => {
    const c = canvasRef.current;
    if (c) {
      if (!reset) designs.current[view] = JSON.stringify(c.toJSON());
      c.discardActiveObject(); c.clear();
      const saved = reset ? undefined : designs.current[next];
      if (saved) c.loadFromJSON(saved, () => c.renderAll());
    }
    setView(next); setSelected(null); setDpi(null);
  };

  const pickProduct = (id: string) => {
    const p = getProduct(id)!;
    designs.current = {};
    setProductId(id);
    setColor(p.colors.find((x) => x.hex === color)?.hex ?? p.colors[0].hex);
    switchView(p.views[0], true);
  };

  const addText = () => {
    const f = fabricRef.current; if (!f) return;
    centerAdd(new f.IText(text || "Text", { fontFamily: "Arial", fontSize: 36, fill: textColor, fontWeight: "bold" }));
  };

  const apply = (s: number, a: number) => {
    if (!selected) return;
    selected.set({ scaleX: s * (selected.flipX ? 1 : 1), scaleY: s, angle: a }); selected.setCoords();
    canvasRef.current?.requestRenderAll(); computeDpi(selected);
  };
  const recolor = (hex: string) => {
    setTextColor(hex);
    if (selected && "text" in selected) { selected.set("fill", hex); canvasRef.current?.requestRenderAll(); }
  };
  const remove = () => { if (selected) { canvasRef.current?.remove(selected); setSelected(null); setDpi(null); } };
  const duplicate = () => {
    if (!selected) return;
    selected.clone((o: FabricNS.Object) => { o.set({ left: (selected.left ?? 0) + 20, top: (selected.top ?? 0) + 20 }); canvasRef.current?.add(o); canvasRef.current?.setActiveObject(o); sync(); });
  };
  const flip = () => { if (selected) { selected.set("flipX", !selected.flipX); canvasRef.current?.requestRenderAll(); } };
  const layer = (dir: 1 | -1) => { if (!selected) return; dir > 0 ? selected.bringForward() : selected.sendBackwards(); canvasRef.current?.requestRenderAll(); };

  const hasContent = () => (canvasRef.current?.getObjects().length ?? 0) > 0;

  const exportPng = (width = EXPORT_WIDTH): string | undefined => {
    const c = canvasRef.current; if (!c) return;
    c.discardActiveObject(); c.requestRenderAll();
    const a = areaRef.current;
    return c.toDataURL({ format: "png", multiplier: width / a.w, left: a.x, top: a.y, width: a.w, height: a.h });
  };

  const download = () => {
    if (!hasContent()) { setNotice("Add an image or text first."); return; }
    const url = exportPng(); if (!url) return;
    const a = document.createElement("a"); a.href = url; a.download = `${product.id}-${view}-print-file.png`; a.click();
  };

  const uploadDesign = async (): Promise<string> => {
    const dataUrl = exportPng()!;
    const blob = await (await fetch(dataUrl)).blob();
    const slotRes = await fetch("/api/designs", { method: "POST" });
    if (!slotRes.ok) throw new Error("Upload is not available");
    const slot = await slotRes.json();
    if (slot.mode === "supabase") {
      const { error } = await supabaseBrowser().storage.from("designs").uploadToSignedUrl(slot.path, slot.token, blob, { contentType: "image/png" });
      if (error) throw error;
    } else {
      const put = await fetch(slot.uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: blob });
      if (!put.ok) throw new Error("Upload failed");
    }
    return slot.path;
  };

  const addToCart = async () => {
    setError(""); setAdded(false);
    if (!hasContent()) { setError("Add an image or text before adding to cart."); return; }
    setAdding(true);
    try {
      const designPath = await uploadDesign();
      const thumb = exportPng(220);
      add({
        id: `${product.id}-${color}-${size}-${designPath}`, productId: product.id, name: product.name,
        color: product.colors.find((c) => c.hex === color)?.name ?? product.colors[0].name,
        size: product.sizes ? size : undefined, price: product.price, quantity: 1, preview: thumb, designPath, view,
      });
      setAdded(true);
    } catch { setError("Could not save your design. Please try again."); }
    finally { setAdding(false); }
  };

  const guide = !preview;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex min-w-0 flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2">
          {products.map((p) => (
            <button key={p.id} onClick={() => p.id !== productId && pickProduct(p.id)}
              className={cn("rounded-full border px-3 py-1 text-sm", p.id === productId ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-100" : "border-slate-300 dark:border-slate-700")}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
        {product.views.length > 1 && (
          <div className="flex gap-2">
            {product.views.map((v) => (
              <button key={v} onClick={() => v !== view && switchView(v)} className={cn("rounded px-3 py-1 text-sm capitalize", v === view ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800")}>{v}</button>
            ))}
          </div>
        )}
        <div ref={frameRef} className="w-full max-w-[500px]"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}>
          <div style={{ height: CANVAS * fit }} className={cn("relative overflow-hidden rounded-xl border bg-gradient-to-b from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900", dragging ? "border-brand-600 ring-2 ring-brand-500" : "border-slate-200 dark:border-slate-800")}>
            <div style={{ width: CANVAS, height: CANVAS, transform: `scale(${fit})`, transformOrigin: "top left" }} className="relative">
              <div className="absolute inset-0"><ProductMockup productId={productId} color={color} view={view} layer="base" className="h-full w-full" /></div>
              <div className="absolute inset-0 z-10"><canvas ref={canvasEl} /></div>
              <div className="pointer-events-none absolute inset-0 z-20"><ProductMockup productId={productId} color={color} view={view} layer="shade" className="h-full w-full" /></div>
              {guide && (
                <svg viewBox={`0 0 ${CANVAS} ${CANVAS}`} className="pointer-events-none absolute inset-0 z-30 h-full w-full">
                  <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="none" stroke="#6366f1" strokeOpacity=".7" strokeDasharray="6 5" />
                </svg>
              )}
            </div>
            {dragging && <div className="absolute inset-0 z-40 flex items-center justify-center bg-brand-600/20 text-lg font-semibold text-brand-700"><UploadCloud className="mr-2" /> Drop image to add</div>}
            {ready && count === 0 && !dragging && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 text-center text-xs text-slate-500">Upload a photo or add text — it appears on the product live</div>
            )}
          </div>
        </div>
        <button onClick={() => { canvasRef.current?.discardActiveObject(); canvasRef.current?.requestRenderAll(); setPreview((p) => !p); }}
          className={cn("flex items-center gap-2 rounded border px-3 py-1.5 text-sm", preview ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-slate-800" : "border-slate-300 dark:border-slate-700")}>
          <Eye size={14} /> {preview ? "Back to editing" : "Preview (hide guides)"}
        </button>
      </div>

      <aside className="space-y-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Product color</h2>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <button key={c.hex} title={c.name} aria-label={c.name} onClick={() => setColor(c.hex)} style={{ background: c.hex }}
                className={cn("h-8 w-8 rounded-full border-2", color === c.hex ? "border-brand-600 ring-2 ring-brand-500/40" : "border-slate-300")} />
            ))}
          </div>
        </div>
        {product.sizes && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">Size</h2>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={cn("rounded border px-3 py-1 text-sm", s === size ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-slate-800" : "border-slate-300 dark:border-slate-700")}>{s}</button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Add your design</h2>
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm hover:border-brand-500 dark:border-slate-700">
            <ImagePlus size={22} /> <span className="font-medium">Upload a photo from your device</span>
            <span className="text-xs text-slate-500">Click, drag &amp; drop, or paste · PNG, JPG, WebP, SVG · max 15 MB</span>
            <input type="file" accept={ACCEPT.join(",")} className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {notice && <p className="text-sm text-red-600">{notice}</p>}
          <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" aria-label="Text" />
          <div className="flex items-center gap-2">
            <input type="color" value={textColor} onChange={(e) => recolor(e.target.value)} aria-label="Text color" className="h-9 w-10" />
            <button onClick={addText} className="flex flex-1 items-center justify-center gap-2 rounded bg-slate-100 p-2 text-sm dark:bg-slate-800"><Type size={16} /> Add text</button>
          </div>
          <p className="text-xs text-slate-500">Want a ready-made design? <Link href="/designs" className="text-brand-600 underline">Browse designs</Link></p>
        </div>
        <div className={cn("space-y-2", !selected && "pointer-events-none opacity-40")}>
          <h2 className="text-sm font-semibold">Selected item</h2>
          {dpi !== null && (
            <p className={cn("flex items-start gap-1 text-xs", dpi < 150 ? "text-amber-600" : "text-green-600")}>
              {dpi < 150 && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              ≈{dpi} DPI at this size — {dpi < 150 ? "may look blurry when printed; use a larger image or make it smaller." : "good for printing."}
            </p>
          )}
          <label className="block text-xs">Size
            <input type="range" min={0.05} max={6} step={0.01} value={scale} className="w-full" onChange={(e) => { const s = +e.target.value; setScale(s); apply(s, angle); }} />
          </label>
          <label className="block text-xs">Rotate ({angle}°)
            <input type="range" min={0} max={360} value={angle} className="w-full" onChange={(e) => { const a = +e.target.value; setAngle(a); apply(scale, a); }} />
          </label>
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => layer(1)} className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-700"><ArrowUp size={12} /> Forward</button>
            <button onClick={() => layer(-1)} className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-700"><ArrowDown size={12} /> Back</button>
            <button onClick={flip} className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-700"><FlipHorizontal size={12} /> Flip</button>
            <button onClick={duplicate} className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-700"><Copy size={12} /> Duplicate</button>
            <button onClick={remove} className="flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-red-600"><Trash2 size={12} /> Delete</button>
          </div>
        </div>
        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="flex justify-between text-sm"><span>Price (incl. GST)</span><strong>{moneyPaise(product.price)}</strong></div>
          <button onClick={addToCart} disabled={adding || !ready} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-50"><ShoppingCart size={16} /> {adding ? "Saving design…" : "Add to cart"}</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {added && <p className="text-sm text-green-600">Added! <Link href="/cart" className="underline">View cart &amp; pay</Link></p>}
          <button onClick={download} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700"><Download size={16} /> Download print file (PNG)</button>
        </div>
      </aside>
    </div>
  );
}

