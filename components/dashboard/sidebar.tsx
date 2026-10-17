"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calculator, LayoutDashboard, Palette, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/customizer", label: "Customizer", icon: Palette },
  { href: "/pricing-calculator", label: "Pricing", icon: Calculator },
  { href: "/shop", label: "Storefront", icon: Store },
  { href: "/dashboard#orders", label: "Orders", icon: BarChart3 },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-full shrink-0 border-b border-slate-200 p-3 dark:border-slate-800 md:w-56 md:border-b-0 md:border-r">
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn("flex items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800",
              path === href && "bg-brand-50 text-brand-700 dark:bg-slate-800")}>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
