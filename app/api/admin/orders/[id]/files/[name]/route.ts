import fs from "node:fs";
import { NextResponse } from "next/server";
import { adminAllowed, tokenFrom } from "@/lib/admin/auth";
import { printFilePath } from "@/lib/printjob";

export async function GET(req: Request, { params }: { params: { id: string; name: string } }) {
  if (!adminAllowed(tokenFrom(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const f = printFilePath(params.id, params.name);
  if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const type = f.endsWith(".png") ? "image/png" : f.endsWith(".html") ? "text/html" : "application/json";
  return new NextResponse(fs.readFileSync(f), { headers: { "Content-Type": type } });
}
