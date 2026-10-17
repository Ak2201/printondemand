import { NextResponse } from "next/server";
import { createUploadSlot } from "@/lib/designs";

/** Step 1: ask for a signed upload slot. Without Supabase (local dev) the client keeps only the preview. */
export async function POST() {
  const slot = await createUploadSlot();
  if (!slot) return NextResponse.json({ error: "Storage not configured" }, { status: 501 });
  return NextResponse.json(slot);
}
