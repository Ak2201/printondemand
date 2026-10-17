import { Suspense } from "react";
import { Customizer } from "@/components/customizer/customizer";

export default function CustomizerPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Product customizer</h1>
      <Suspense fallback={null}><Customizer /></Suspense>
    </main>
  );
}
