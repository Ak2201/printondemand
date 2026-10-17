import crypto from "node:crypto";

/** ADMIN_TOKEN guards /admin and /api/admin; when unset, access is allowed only outside production. */
export function adminAllowed(given: string | null | undefined): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";
  const a = Buffer.from(given ?? ""), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const tokenFrom = (req: Request) => new URL(req.url).searchParams.get("token") ?? req.headers.get("x-admin-token");
