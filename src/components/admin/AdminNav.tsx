"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/vitrine", label: "Vitrine / Home" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/clientes", label: "Clientes" },
];

export function AdminNav({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.14em]">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center border-b border-line px-1 py-1.5",
                active ? "text-burgundy" : "text-taupe hover:bg-sand hover:text-burgundy",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-10 border-t border-ivory/15">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex w-full items-center border-b border-ivory/15 px-6 py-3.5 text-[12px] uppercase tracking-[0.18em] transition",
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
