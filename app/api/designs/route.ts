import { NextResponse } from "next/server";
import { createUploadSlot, localDesignsEnabled, newDesignPath } from "@/lib/designs";

/** Step 1 of design upload. Supabase: signed slot. Local dev: PUT the PNG to uploadUrl. */
export async function POST() {
  const slot = await createUploadSlot();
  if (slot) return NextResponse.json({ mode: "supabase", ...slot });
  if (localDesignsEnabled()) {
    const path = newDesignPath();
    return NextResponse.json({ mode: "local", path, uploadUrl: `/api/designs/${path}` });
  }
  return NextResponse.json({ error: "Storage not configured" }, { status: 501 });
}
