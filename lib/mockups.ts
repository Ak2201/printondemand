import type { ProductView } from "@/types";

export const CANVAS = 500; // mockups and the Fabric canvas share one 500x500 coordinate space

export interface PrintArea { x: number; y: number; w: number; h: number; widthIn: number }

/** Printable rectangle per product/view, in canvas px. widthIn is the real print width (for DPI estimates). */
export const printAreas: Record<string, Partial<Record<ProductView, PrintArea>>> = {
  tshirt: { front: { x: 160, y: 125, w: 180, h: 230, widthIn: 12 }, back: { x: 155, y: 110, w: 190, h: 250, widthIn: 12 } },
  hoodie: { front: { x: 170, y: 160, w: 160, h: 170, widthIn: 11 }, back: { x: 155, y: 110, w: 190, h: 260, widthIn: 12 } },
  mug: { wrap: { x: 108, y: 200, w: 244, h: 104, widthIn: 8.5 } },
  phonecase: { back: { x: 182, y: 135, w: 136, h: 295, widthIn: 2.9 } },
  canvas: { front: { x: 100, y: 50, w: 300, h: 400, widthIn: 12 } },
};

export function getPrintArea(productId: string, view: ProductView): PrintArea {
  const a = printAreas[productId]?.[view] ?? Object.values(printAreas[productId] ?? {})[0] ?? printAreas.tshirt.front!;
  return a;
}
