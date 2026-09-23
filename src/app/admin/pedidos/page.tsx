import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { listOrders } from "@/services/order.service";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { createMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = createMetadata({ title: "Pedidos", noIndex: true });

const statusTone: Record<string, string> = {
  PENDING: "border-gold/50 bg-gold/15 text-burgundy",
  PAID: "border-ink/30 bg-ink/10 text-ink",
  PROCESSING: "border-burgundy/20 bg-burgundy text-ivory",
  SHIPPED: "border-wine/30 bg-wine/10 text-wine",
  DELIVERED: "border-ink/30 bg-ink text-white",
  CANCELLED: "border-line bg-sand text-taupe",
};

function formatOrderDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof listOrders>> = [];
  let dbDown = false;
  try {
    orders = await listOrders();
  } catch {
    dbDown = true;
  }

  return (
    <AdminShell>
      <p className="eyebrow">Vendas</p>
      <h1 className="display mt-2 text-4xl">Pedidos</h1>
      <p className="mt-2 max-w-xl text-sm text-taupe">Cada card mostra a situação atual e as peças do pedido.</p>
      {dbDown ? <DbUnavailableBanner /> : null}
      {!dbDown && orders.length === 0 ? (
        <p className="mt-10 text-sm text-taupe">Nenhum pedido ainda.</p>
      ) : null}
      {orders.length > 0 ? (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="block h-full border border-line bg-white p-5 shadow-[0_8px_24px_rgba(23,22,17,0.05)] transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_12px_28px_rgba(64,8,2,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-2xl">{order.number}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-taupe">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                      statusTone[order.status] ?? statusTone.PENDING,
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="mt-4 text-sm">{order.customerName}</p>
                <p className="text-xs text-taupe">{order.email}</p>
                <p className="mt-2 text-xs text-taupe">
                  Pagamento: {order.payment ? PAYMENT_STATUS_LABELS[order.payment.status] : "—"}
                </p>
                <ul className="mt-4 space-y-2">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-cream">
                        {item.imageUrl ? (
                          <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        ) : null}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm">{item.name}</p>
                      <span className="text-sm">{formatBRL(item.priceCents * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {order.items.length > 3 ? (
                  <p className="mt-2 text-xs text-taupe">+ {order.items.length - 3} peça(s)</p>
                ) : null}
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm text-taupe">Total</span>
                  <span className="font-bold text-gold">{formatBRL(order.totalCents)}</span>
                </div>
                <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-burgundy">Ver e atualizar situação</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminShell>
  );
}
