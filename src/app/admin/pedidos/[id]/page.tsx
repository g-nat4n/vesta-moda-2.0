import { notFound } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { getOrderById } from "@/services/order.service";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { RefundOrderButton } from "@/components/admin/RefundOrderButton";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  let order: Awaited<ReturnType<typeof getOrderById>> = null;
  let dbDown = false;

  try {
    order = await getOrderById(id);
  } catch {
    dbDown = true;
  }

  if (dbDown) {
    return (
      <AdminShell>
        <AdminBackLink href="/admin/pedidos" label="Voltar aos pedidos" />
        <p className="eyebrow">Pedido</p>
        <h1 className="display mt-2 text-4xl">Detalhe</h1>
        <DbUnavailableBanner />
      </AdminShell>
    );
  }

  if (!order) notFound();

  return (
    <AdminShell>
      <AdminBackLink href="/admin/pedidos" label="Voltar aos pedidos" />
      <p className="eyebrow">Pedido</p>
      <h1 className="display mt-2 text-4xl">{order.number}</h1>
      <p className="mt-3 text-sm text-taupe">
        Situação: {ORDER_STATUS_LABELS[order.status]} · Pagamento{" "}
        {order.payment ? PAYMENT_STATUS_LABELS[order.payment.status] : "—"}
      </p>
      <OrderStatusForm id={order.id} status={order.status} />
      {order.payment?.status === "APPROVED" ? (
        <RefundOrderButton orderId={order.id} orderNumber={order.number} />
      ) : null}
      {order.payment?.status === "REFUNDED" ? (
        <p className="mt-6 max-w-md border border-line bg-cream/60 px-4 py-3 text-sm text-taupe">
          Este pedido já foi reembolsado. As peças voltaram ao estoque.
        </p>
      ) : null}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="border border-line bg-white p-6">
          <h2 className="display text-2xl">Cliente</h2>
          <p className="mt-3 text-sm leading-relaxed">
            {order.customerName}
            <br />
            {order.email}
            <br />
            {order.phone}
            <br />
            CPF {order.cpf}
          </p>
        </div>
        <div className="border border-line bg-white p-6">
          <h2 className="display text-2xl">Endereço</h2>
          <p className="mt-3 text-sm leading-relaxed">
            {order.street}, {order.numberAddress} {order.complement}
            <br />
            {order.district} · {order.city}/{order.state}
            <br />
            {order.zip}
            <br />
            {order.shippingLabel}
          </p>
        </div>
      </div>
      <ul className="mt-8 divide-y divide-line border border-line bg-white px-6 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-cream">
              {item.imageUrl ? (
                <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
              ) : null}
            </div>
            <span className="flex-1">
              {item.name} · {item.size}
            </span>
            <span>{formatBRL(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-right font-bold text-gold">{formatBRL(order.totalCents)}</p>
    </AdminShell>
  );
}
