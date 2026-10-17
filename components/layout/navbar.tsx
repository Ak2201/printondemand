"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Menu, Moon, ShoppingCart, Sun, X } from "lucide-react";
import { useCart } from "@/store/cart";

const links = [
  { href: "/designs", label: "Designs" },
  { href: "/shop", label: "Shop" },
  { href: "/customizer", label: "Customizer" },
  { href: "/pricing-calculator", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-brand-600">PrintForge</Link>
        <nav className="hidden gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm hover:text-brand-600">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle theme" className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {mounted && resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/cart" aria-label="Cart" className="relative rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ShoppingCart size={18} />
            {mounted && count > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{count}</span>
            )}
          </Link>
          <button aria-label="Menu" className="rounded p-2 md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 p-3 dark:border-slate-800 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{l.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
