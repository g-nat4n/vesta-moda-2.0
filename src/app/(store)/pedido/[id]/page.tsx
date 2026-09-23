import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { getOrderById } from "@/services/order.service";
import { syncOrderFromMercadoPagoReturn } from "@/services/payment.service";
import { formatBRL } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { createMetadata } from "@/lib/seo";

type Params = Promise<{ id: string }>;

export const metadata = createMetadata({
  title: "Pedido",
  path: "/pedido",
  noIndex: true,
});

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{
    result?: string;
    status?: string;
    payment_id?: string;
    collection_id?: string;
    collection_status?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await auth();

  const paymentId = query.payment_id || query.collection_id;
  const collectionStatus = query.collection_status || query.status;

  if (paymentId || collectionStatus === "rejected" || collectionStatus === "cancelled") {
    try {
      await syncOrderFromMercadoPagoReturn({
        orderId: id,
        paymentId,
        collectionStatus,
      });
    } catch {
      // Mantém a página mesmo se a sincronização falhar; o status do banco ainda aparece.
    }
  }

  const order = await getOrderById(id);
  if (!order) notFound();

  const canView =
    session?.user.role === "ADMIN" ||
    (session?.user.id && session.user.id === order.userId) ||
    true;

  if (!canView) notFound();

  const result = query.result;
  const paymentStatus = order.payment?.status;
  const approved =
    paymentStatus === "APPROVED" || result === "success" || collectionStatus === "approved";
  const failed =
    paymentStatus === "REJECTED" ||
    result === "failure" ||
    collectionStatus === "rejected" ||
    collectionStatus === "cancelled";
  const pendingPayment =
    result === "pending-payment" ||
    result === "pending" ||
    (!approved && !failed && paymentStatus === "PENDING");

  return (
    <StoreShell>
      <section className="container-main py-16">
        <p className="eyebrow">Pedido</p>
        <h1 className="display mt-2 text-4xl">{order.number}</h1>

        {approved ? (
          <div className="mt-8 border border-ink/20 bg-white px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
              Pagamento aprovado
            </p>
            <p className="mt-2 text-sm text-ink">
              Recebemos o pagamento. Guarde o código da compra{" "}
              <span className="font-semibold">{order.number}</span>.
            </p>
            <p className="mt-1 text-sm text-taupe">
              Em breve o atelier prepara o envio ou a retirada.
            </p>
          </div>
        ) : null}

        {failed ? (
          <div className="mt-8 border border-wine/30 bg-white/70 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wine">
              Pagamento não aprovado
            </p>
            <p className="mt-2 text-sm text-ink">
              O cartão não passou ou o pagamento foi recusado. O pedido{" "}
              <span className="font-semibold">{order.number}</span> ficou sem confirmação.
            </p>
            <p className="mt-1 text-sm text-taupe">
              Você pode tentar de novo pelo checkout ou escolher outra peça.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button href="/checkout" variant="burgundy">
                Tentar novamente
              </Button>
              <Button href="/produtos" variant="ghost">
                Ver curadoria
              </Button>
            </div>
          </div>
        ) : null}

        {pendingPayment && !approved && !failed ? (
          <div className="mt-8 border border-gold/40 bg-white/70 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-burgundy">
              Pagamento pendente
            </p>
            <p className="mt-2 text-sm text-ink">
              Seu pedido <span className="font-semibold">{order.number}</span> foi registrado e
              aguarda a confirmação do pagamento
              {result === "pending-payment"
                ? " (Mercado Pago ainda não configurado neste ambiente)."
                : "."}
            </p>
          </div>
        ) : null}

        <p className="mt-6 text-sm text-taupe">
          Situação do pedido: {ORDER_STATUS_LABELS[order.status]} · Pagamento:{" "}
          {order.payment ? PAYMENT_STATUS_LABELS[order.payment.status] : "—"}
        </p>

        <ul className="mt-10 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative h-20 w-16 bg-cream">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p>{item.name}</p>
                <p className="text-sm text-taupe">
                  {item.brand} · Tam. {item.size}
                </p>
              </div>
              <span>{formatBRL(item.priceCents)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-8 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatBRL(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Frete · {order.shippingLabel}</dt>
            <dd>{formatBRL(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Descontos</dt>
            <dd>- {formatBRL(order.discountCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <dt>Total</dt>
            <dd>{formatBRL(order.totalCents)}</dd>
          </div>
        </dl>

        <div className="mt-8 text-sm leading-relaxed text-taupe">
          <p>
            {order.customerName} · {order.email}
          </p>
          <p>
            {order.street}, {order.numberAddress} {order.complement} — {order.district}
          </p>
          <p>
            {order.city}/{order.state} · {order.zip}
          </p>
        </div>

        {approved || pendingPayment ? (
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/produtos" variant="ghost">
              Continuar na loja
            </Button>
            {session?.user ? (
              <Button href="/minha-conta" variant="burgundy">
                Ver minha conta
              </Button>
            ) : (
              <Link href="/" className="text-sm text-burgundy">
                Voltar ao início
              </Link>
            )}
          </div>
        ) : null}
      </section>
    </StoreShell>
  );
}
