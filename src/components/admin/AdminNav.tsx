"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/best-sellers", label: "Best Sellers" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/clientes", label: "Clientes" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 mt-10 border-t border-ivory/15">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            className={cn(
              "relative z-10 flex w-full items-center border-b border-ivory/15 px-6 py-3.5 text-[12px] uppercase tracking-[0.18em] transition",
              active
                ? "bg-ivory/10 text-gold"
                : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
