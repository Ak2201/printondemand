import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { StoredOrder } from "@/lib/order-types";

/**
 * Local dev store: a single JSON file (.data/orders.json), used only when Supabase is not configured.
 * Writes are atomic (temp file + rename) and serialised through a lock on globalThis so separate
 * Next route bundles in one process do not lose updates; data survives restarts.
 */
export const DATA_DIR = process.env.POD_DATA_DIR ? path.resolve(process.env.POD_DATA_DIR) : path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "orders.json");

interface Db { orders: Record<string, StoredOrder>; events: string[]; payments: string[] }
const g = globalThis as unknown as { __podLock?: Promise<unknown> };

function read(): Db {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, "utf8")) as Db;
    return { orders: d.orders ?? {}, events: d.events ?? [], payments: d.payments ?? [] };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { orders: {}, events: [], payments: [] };
    throw e;
  }
}

function write(db: Db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

/** Run a read-modify-write transaction; the mutator's changes are saved unless it throws. */
export function localTx<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const db = read();
    const out = await fn(db);
    write(db);
    return out;
  };
  const next = (g.__podLock ?? Promise.resolve()).then(run, run);
  g.__podLock = next.catch(() => undefined);
  return next;
}

export const localRead = (): Db => read();
