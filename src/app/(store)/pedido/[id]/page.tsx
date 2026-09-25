import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { getOrderById } from "@/services/order.service";
import {
  syncOrderFromMercadoPagoReturn,
  canCustomerCancelOrder,
} from "@/services/payment.service";
import { formatBRL } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { createMetadata } from "@/lib/seo";
import { CancelOrderButton } from "@/components/checkout/CancelOrderButton";
import { CancelledOrderActions } from "@/components/checkout/CancelledOrderActions";
import { canAccessOrder, readOrderAccessToken } from "@/lib/order-access";

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
    cancelled?: string;
    refunded?: string;
    access?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await auth();
  const accessToken = await readOrderAccessToken(id, query.access);

  const order = await getOrderById(id);
  if (!order) notFound();

  const canView = canAccessOrder(order, session, accessToken);
  if (!canView) notFound();

  const paymentId = query.payment_id || query.collection_id;
  const collectionStatus = query.collection_status || query.status;
  const justCancelled = query.cancelled === "1";
  const justRefunded = query.refunded === "1";

  // Só sincroniza com payment_id real do MP (amarrado ao orderId).
  // collection_status na query NUNCA cancela/altera pedido.
  if (paymentId && canView) {
    try {
      await syncOrderFromMercadoPagoReturn({
        orderId: id,
        paymentId,
      });
    } catch {
      // Mantém a página mesmo se a sincronização falhar.
    }
  }

  const fresh = (await getOrderById(id)) ?? order;
  const result = query.result;
  const paymentStatus = fresh.payment?.status;
  const refunded = paymentStatus === "REFUNDED" || fresh.status === "CANCELLED";
  const approved =
    !refunded &&
    (paymentStatus === "APPROVED" || result === "success" || collectionStatus === "approved");
  const failed =
    !refunded &&
    (paymentStatus === "REJECTED" ||
      result === "failure" ||
      collectionStatus === "rejected" ||
      collectionStatus === "cancelled");
  const pendingPayment =
    !refunded &&
    (result === "pending-payment" ||
      result === "pending" ||
      (!approved && !failed && paymentStatus === "PENDING"));

  const canCancel = canCustomerCancelOrder(fresh);
  const payHref = accessToken
    ? `/pedido/${fresh.id}/pagar?access=${encodeURIComponent(accessToken)}`
    : `/pedido/${fresh.id}/pagar`;

  return (
    <StoreShell>
      <section className="container-main py-16">
        <p className="eyebrow">Pedido</p>
        <h1 className="display mt-2 text-4xl">{fresh.number}</h1>

        {approved ? (
          <div className="mt-8 border border-ink/20 bg-white px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
              Pagamento aprovado
            </p>
            <p className="mt-2 text-sm text-ink">
              Recebemos o pagamento. Guarde o código da compra{" "}
              <span className="font-semibold">{fresh.number}</span>.
            </p>
            <p className="mt-1 text-sm text-taupe">
              Em breve o atelier prepara o envio ou a retirada.
            </p>
          </div>
        ) : null}

        {refunded && !failed ? (
          <div className="mt-8 border border-line bg-cream/70 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-taupe">
              {justCancelled ? "Cancelamento confirmado" : "Pedido cancelado"}
            </p>
            <p className="mt-2 text-sm text-ink">
              {justCancelled
                ? "Sua compra foi cancelada com sucesso."
                : "Esta compra foi cancelada."}
              {paymentStatus === "REFUNDED" || justRefunded
                ? " O valor será estornado conforme o prazo do seu cartão ou meio de pagamento."
                : ""}
            </p>
            <p className="mt-2 text-sm text-taupe">
              Enviamos um e-mail para <span className="text-ink">{fresh.email}</span> com essa
              confirmação. Se não aparecer, confira o spam.
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
              <span className="font-semibold">{fresh.number}</span> ficou sem confirmação.
            </p>
            <p className="mt-1 text-sm text-taupe">
              Você pode tentar de novo com outro cartão ou escolher outra peça.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button href={payHref} variant="burgundy">
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
              Seu pedido <span className="font-semibold">{fresh.number}</span> foi registrado e
              aguarda a confirmação do pagamento
              {result === "pending-payment"
                ? " (Mercado Pago ainda não configurado neste ambiente)."
                : "."}
            </p>
            {result !== "pending-payment" ? (
              <div className="mt-5">
                <Button href={payHref} variant="burgundy">
                  Pagar com cartão
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="mt-6 text-sm text-taupe">
          Situação do pedido: {ORDER_STATUS_LABELS[fresh.status]} · Pagamento:{" "}
          {fresh.payment ? PAYMENT_STATUS_LABELS[fresh.payment.status] : "—"}
        </p>

        <ul className="mt-10 divide-y divide-line">
          {fresh.items.map((item) => (
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
            <dd>{formatBRL(fresh.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Frete · {fresh.shippingLabel}</dt>
            <dd>{formatBRL(fresh.shippingCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Descontos</dt>
            <dd>- {formatBRL(fresh.discountCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <dt>Total</dt>
            <dd>{formatBRL(fresh.totalCents)}</dd>
          </div>
        </dl>

        <div className="mt-8 text-sm leading-relaxed text-taupe">
          <p>
            {fresh.customerName} · {fresh.email}
          </p>
          <p>
            {fresh.street}, {fresh.numberAddress} {fresh.complement} — {fresh.district}
          </p>
          <p>
            {fresh.city}/{fresh.state} · {fresh.zip}
          </p>
        </div>

        {approved || pendingPayment ? (
          <div className="mt-10 flex flex-wrap items-start gap-3">
            <Button href="/produtos" variant="ghost">
              Continuar na loja
            </Button>
            {session?.user ? (
              <Button href="/minha-conta" variant="burgundy">
                Ver minha conta
              </Button>
            ) : (
              <Link href="/" className="inline-flex min-h-12 items-center text-sm text-burgundy">
                Voltar ao início
              </Link>
            )}
            {canCancel ? (
              <CancelOrderButton
                orderId={fresh.id}
                paid={paymentStatus === "APPROVED"}
              />
            ) : null}
          </div>
        ) : null}

        {refunded && !failed ? (
          <CancelledOrderActions loggedIn={Boolean(session?.user)} />
        ) : null}

        {!canCancel &&
        (fresh.status === "SHIPPED" || fresh.status === "DELIVERED") &&
        paymentStatus === "APPROVED" ? (
          <p className="mt-8 max-w-xl text-sm text-taupe">
            O pedido já saiu para entrega. Para desistir, fale com o atelier pelo WhatsApp
            ou e-mail — o cancelamento automático não fica disponível nessa etapa.
          </p>
        ) : null}
      </section>
    </StoreShell>
  );
}
