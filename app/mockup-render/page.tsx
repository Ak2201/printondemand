import { notFound } from "next/navigation";
import { RenderFrame } from "./frame";

/** Dev-only: renders one mockup for scripts/shopify-export.ts to screenshot. */
export default function MockupRender({ searchParams }: { searchParams: Record<string, string> }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <RenderFrame productId={searchParams.product ?? "tshirt"} color={`#${searchParams.color ?? "ffffff"}`} view={(searchParams.view as "front") ?? "front"} design={searchParams.design} />;
}
