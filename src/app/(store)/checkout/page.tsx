import { StoreShell } from "@/components/layout/StoreShell";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { createMetadata } from "@/lib/seo";
import { auth } from "@/auth";

export const metadata = createMetadata({
  title: "Checkout",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutPage() {
  const session = await auth();
  const localMock =
    process.env.MERCADOPAGO_LOCAL_MOCK === "true" &&
    process.env.MERCADOPAGO_SANDBOX === "true";

  return (
    <StoreShell>
      <section className="container-main py-16">
        <p className="eyebrow">Finalização</p>
        <h1 className="display mt-2 text-4xl">Checkout</h1>
        {localMock ? (
          <p className="mt-4 max-w-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
            Modo teste local: ao finalizar, o pedido é <strong>aprovado na hora</strong> (sem abrir o
            Mercado Pago). Para testar o Checkout Pro, no{" "}
            <code className="text-xs">.env</code> use{" "}
            <code className="text-xs">MERCADOPAGO_LOCAL_MOCK=&quot;false&quot;</code>.
          </p>
        ) : (
          <p className="mt-4 max-w-2xl border border-line bg-cream/80 px-4 py-3 text-sm text-taupe">
            Checkout Pro: abra em <strong>janela anônima</strong>, entre com a conta{" "}
            <strong>compradora de teste</strong> do painel (Contas de teste → Comprador) e cartão{" "}
            <code className="text-xs">5480 8328 0103 3311</code> / CVV{" "}
            <code className="text-xs">123</code> / validade{" "}
            <code className="text-xs">11/30</code> / nome <code className="text-xs">APRO</code> /
            CPF <code className="text-xs">12345678909</code>. Não use sua conta real.
          </p>
        )}
        <CheckoutForm
          defaultEmail={session?.user.email ?? ""}
          defaultName={session?.user.name ?? ""}
        />
      </section>
    </StoreShell>
  );
}
