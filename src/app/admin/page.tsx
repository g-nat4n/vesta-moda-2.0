import { AdminShell } from "@/components/admin/AdminShell";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Atelier",
  path: "/admin",
  noIndex: true,
});

export default async function AdminHome() {
  let products = 0;
  let orders = 0;
  let available = 0;
  let sold = 0;
  let revenueCents = 0;
  let dbDown = false;

  try {
    const [p, o, a, s, revenue] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.product.count({ where: { status: "AVAILABLE" } }),
      prisma.product.count({ where: { status: "SOLD" } }),
      prisma.order.aggregate({
        _sum: { totalCents: true },
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      }),
    ]);
    products = p;
    orders = o;
    available = a;
    sold = s;
    revenueCents = revenue._sum.totalCents ?? 0;
  } catch {
    dbDown = true;
  }

  const cards = [
    { label: "Peças no acervo", value: dbDown ? "—" : String(products) },
    { label: "Disponíveis", value: dbDown ? "—" : String(available) },
    { label: "Vendidas", value: dbDown ? "—" : String(sold) },
    { label: "Pedidos", value: dbDown ? "—" : String(orders) },
    { label: "Receita confirmada", value: dbDown ? "—" : formatBRL(revenueCents) },
  ];

  return (
    <AdminShell>
      <p className="eyebrow">Painel</p>
      <h1 className="display mt-2 text-4xl">Atelier Vesta</h1>
      <p className="mt-2 max-w-xl text-sm text-taupe">
        Cadastre peças, organize os Best Sellers da home, categorias e acompanhe pedidos.
      </p>
      {dbDown ? <DbUnavailableBanner /> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        {[
          { href: "/admin/produtos/novo", label: "Nova peça" },
          { href: "/admin/best-sellers", label: "Best Sellers" },
          { href: "/admin/categorias", label: "Categorias" },
          { href: "/admin/pedidos", label: "Pedidos" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="border border-line bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink transition hover:border-gold hover:text-burgundy"
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="border border-line bg-white p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-taupe">{card.label}</p>
            <p className="display mt-3 text-3xl">{card.value}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
