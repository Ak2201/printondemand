import fs from "node:fs";
import { NextResponse } from "next/server";
import { designPathRe } from "@/lib/design-path";
import { isPng, localDesignFile, localDesignsEnabled, MAX_DESIGN_BYTES, saveLocalDesign } from "@/lib/designs";

type Ctx = { params: { path: string } };

export async function PUT(req: Request, { params }: Ctx) {
  if (!localDesignsEnabled()) return NextResponse.json({ error: "Local design storage disabled" }, { status: 403 });
  if (!designPathRe.test(params.path)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length > MAX_DESIGN_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });
  if (!isPng(bytes)) return NextResponse.json({ error: "Not a PNG" }, { status: 400 });
  await saveLocalDesign(params.path, bytes);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: Ctx) {
  if (!localDesignsEnabled() || !designPathRe.test(params.path)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const f = localDesignFile(params.path);
  if (!fs.existsSync(f)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(fs.readFileSync(f), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=60" } });
}
