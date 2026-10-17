import { getAdmin } from "@/lib/supabase/admin";

export const DESIGN_BUCKET = "designs";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // supplier has 7 days to download

export const newDesignPath = () => `${crypto.randomUUID()}.png`;

/** Signed upload slot so the browser sends the large PNG straight to storage (avoids serverless body limits). */
export async function createUploadSlot() {
  const db = getAdmin();
  if (!db) return null;
  const path = newDesignPath();
  const { data, error } = await db.storage.from(DESIGN_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path, token: data.token };
}

export async function getDesignUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const db = getAdmin();
  if (!db) return `dev-design://${path}`;
  const { data, error } = await db.storage.from(DESIGN_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}
