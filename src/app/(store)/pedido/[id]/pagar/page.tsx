import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { CardPaymentBrick } from "@/components/checkout/CardPaymentBrick";
import { getOrderById } from "@/services/order.service";
import { formatBRL } from "@/lib/format";
import { createMetadata } from "@/lib/seo";
import { auth } from "@/auth";
import { canAccessOrder, readOrderAccessToken } from "@/lib/order-access";

type Params = Promise<{ id: string }>;

export const metadata = createMetadata({
  title: "Pagar pedido",
  path: "/pedido",
  noIndex: true,
});

export default async function PayOrderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ access?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await auth();
  const accessToken = await readOrderAccessToken(id, query.access);
  const order = await getOrderById(id);
  if (!order) notFound();
  if (!canAccessOrder(order, session, accessToken)) notFound();

  if (order.payment?.status === "APPROVED") {
    const q = accessToken ? `?result=success&access=${encodeURIComponent(accessToken)}` : "?result=success";
    redirect(`/pedido/${order.id}${q}`);
  }

  const publicKey =
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() ||
    process.env.MERCADOPAGO_PUBLIC_KEY?.trim() ||
    "";

  const amount = Math.max(order.totalCents / 100, 1);
  const detailsHref = accessToken
    ? `/pedido/${order.id}?access=${encodeURIComponent(accessToken)}`
    : `/pedido/${order.id}`;

  return (
    <StoreShell>
      <section className="container-main py-16">
        <p className="eyebrow">Pagamento</p>
        <h1 className="display mt-2 text-4xl">Pedido {order.number}</h1>
        <p className="mt-3 max-w-xl text-sm text-taupe">
          Total{" "}
          <span className="font-semibold text-ink">{formatBRL(order.totalCents)}</span>
          . Preencha o cartão abaixo — sem abrir conta no Mercado Pago.
        </p>

        <div className="mt-6 max-w-xl border border-line bg-cream/60 px-4 py-3 text-sm text-taupe space-y-2">
          <p>
            Cartão Mastercard de teste:{" "}
            <code className="text-xs text-ink">5480 8328 0103 3311</code> · CVV{" "}
            <code className="text-xs text-ink">123</code> · validade{" "}
            <code className="text-xs text-ink">11/30</code>
          </p>
          <p>
            No titular use nome <code className="text-xs text-ink">APRO</code> e CPF{" "}
            <code className="text-xs text-ink">123.456.789-09</code> (obrigatório para
            aprovar).
          </p>
        </div>

        <div className="mt-10 max-w-xl">
          <CardPaymentBrick
            orderId={order.id}
            amount={amount}
            email={order.email}
            publicKey={publicKey}
            accessToken={accessToken}
          />
        </div>

        <p className="mt-8 text-sm text-taupe">
          <Link
            href={detailsHref}
            className="text-burgundy underline-offset-2 hover:underline"
          >
            Ver detalhes do pedido
          </Link>
        </p>
      </section>
    </StoreShell>
  );
}
