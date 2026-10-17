import { products } from "@/lib/products";
import { money } from "@/lib/utils";

const orders = [
  { id: "#1042", item: "Classic T-Shirt", total: 24.99, status: "In production" },
  { id: "#1041", item: "Ceramic Mug 11oz", total: 16.99, status: "Shipped" },
  { id: "#1040", item: "Pullover Hoodie", total: 49.99, status: "Delivered" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Catalog products", String(products.length)], ["Orders (demo)", String(orders.length)], ["Revenue (demo)", money(orders.reduce((n, o) => n + o.total, 0))]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-sm text-slate-500">{k}</div>
            <div className="text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      <section id="orders">
        <h2 className="mb-2 font-semibold">Recent orders</h2>
        <table className="w-full text-sm">
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-200 dark:border-slate-800">
                <td className="py-2">{o.id}</td><td>{o.item}</td><td>{money(o.total)}</td><td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
