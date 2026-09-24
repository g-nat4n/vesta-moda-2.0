"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/best-sellers", label: "Best Sellers" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/clientes", label: "Clientes" },
];

export function AdminMobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="relative z-20 border-b border-line bg-white md:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-serif text-xl tracking-[0.14em] text-ink">VESTA</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold">Atelier</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="border border-gold px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-burgundy transition hover:bg-gold"
          >
            Loja
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="admin-mobile-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-ink"
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="admin-mobile-menu"
          className="absolute inset-x-0 top-full z-30 border-b border-line bg-white shadow-[0_16px_40px_rgba(23,22,17,0.12)]"
        >
          <ul className="divide-y divide-line">
            {links.map((link) => {
              const active =
                link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] transition",
                      active ? "bg-sand text-burgundy" : "text-ink hover:bg-cream",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-burgundy"
              >
                Voltar para a loja
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
