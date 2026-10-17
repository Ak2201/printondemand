import { notFound } from "next/navigation";
import { getCatalogDesign } from "@/lib/design-catalog";
import { DesignDetail } from "./detail";

export default function DesignPage({ params }: { params: { slug: string } }) {
  const design = getCatalogDesign(params.slug);
  if (!design) notFound();
  return <DesignDetail design={design} />;
}
