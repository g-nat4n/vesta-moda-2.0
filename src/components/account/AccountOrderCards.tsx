import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";

type OrderItem = {
  id: string;
  name: string;
  brand: string;
  size: string;
  priceCents: number;
  quantity: number;
  imageUrl: string | null;
  slug: string;
};

type Payment = {
  status: keyof typeof PAYMENT_STATUS_LABELS;
} | null;

type Order = {
  id: string;
  number: string;
  status: keyof typeof ORDER_STATUS_LABELS;
  createdAt: Date;
  totalCents: number;
  items: OrderItem[];
  payment: Payment;
};

function formatOrderDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function orderBucket(order: Order): "active" | "done" | "cancelled" {
  if (order.status === "CANCELLED" || order.payment?.status === "REFUNDED") {
    return "cancelled";
  }
  if (order.status === "DELIVERED") return "done";
  return "active";
}

function statusTone(bucket: "active" | "done" | "cancelled") {
  if (bucket === "cancelled") return "border-wine/30 text-wine";
  if (bucket === "done") return "border-ink/20 text-ink";
  return "border-gold/40 text-burgundy";
}

function OrderList({
  title,
  hint,
  orders,
}: {
  title: string;
  hint: string;
  orders: Order[];
}) {
  if (orders.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-taupe">{title}</h3>
      <p className="mt-1 text-sm text-taupe">{hint}</p>
      <ul className="mt-5 divide-y divide-line border border-line bg-white">
        {orders.map((order) => {
          const bucket = orderBucket(order);
          const cover = order.items[0]?.imageUrl;
          return (
            <li key={order.id}>
              <Link
                href={`/pedido/${order.id}`}
                className="flex gap-4 px-4 py-4 transition hover:bg-cream/50 sm:px-5"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={order.items[0]?.name ?? order.number}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{order.number}</p>
                    <span
                      className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${statusTone(bucket)}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-taupe">
                    {order.items.map((item) => item.name).join(" · ")}
                  </p>
                  <p className="mt-1 text-xs text-taupe">
                    {formatOrderDate(order.createdAt)}
                    {order.payment
                      ? ` · Pagamento ${PAYMENT_STATUS_LABELS[order.payment.status]}`
                      : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-ink">{formatBRL(order.totalCents)}</p>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-burgundy">
                    Ver pedido
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AccountOrderCards({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="mt-4 text-sm text-taupe">
        Você ainda não fez um pedido.{" "}
        <Link href="/produtos" className="text-burgundy hover:text-wine">
          Ver curadoria
        </Link>
      </p>
    );
  }

  const active = orders.filter((order) => orderBucket(order) === "active");
  const done = orders.filter((order) => orderBucket(order) === "done");
  const cancelled = orders.filter((order) => orderBucket(order) === "cancelled");

  return (
    <div>
      <OrderList
        title="Em andamento"
        hint="Pagos, em preparação ou a caminho."
        orders={active}
      />
      <OrderList
        title="Finalizados"
        hint="Pedidos entregues."
        orders={done}
      />
      <OrderList
        title="Cancelados"
        hint="Compras canceladas ou reembolsadas."
        orders={cancelled}
      />
    </div>
  );
}
