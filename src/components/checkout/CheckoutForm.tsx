"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { formatBRL, formatCep, formatCpf, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ShippingQuote } from "@/types";

export function CheckoutForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const { items, subtotalCents, clear, removeItem, setQuantity } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [shippingId, setShippingId] = useState("pickup");
  const [discount, setDiscount] = useState(0);
  const [form, setForm] = useState({
    customerName: defaultName,
    email: defaultEmail,
    cpf: "",
    phone: "",
    zip: "",
    street: "",
    numberAddress: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    couponCode: "",
  });

  const shipping = quotes.find((quote) => quote.id === shippingId);
  const total = Math.max(subtotalCents - discount + (shipping?.priceCents ?? 0), 0);
  const hasUnavailable = items.some((item) => item.stock < 1);

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onCepBlur() {
    if (form.zip.replace(/\D/g, "").length !== 8) return;
    const [addressRes, quoteRes] = await Promise.all([
      fetch("/api/shipping/cep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: form.zip }),
      }),
      fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: form.zip }),
      }),
    ]);
    const address = await addressRes.json();
    const quote = await quoteRes.json();
    if (addressRes.ok) {
      setForm((current) => ({
        ...current,
        street: address.street || current.street,
        district: address.district || current.district,
        city: address.city || current.city,
        state: address.state || current.state,
        zip: address.zip,
      }));
    }
    if (quoteRes.ok) {
      setQuotes(quote.quotes ?? []);
      setShippingId(quote.quotes?.[0]?.id ?? "pickup");
    }
  }

  async function applyCoupon() {
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.couponCode, subtotalCents }),
    });
    const data = await response.json();
    if (!response.ok) {
      setDiscount(0);
      setError(data.message);
      return;
    }
    setDiscount(data.discountCents);
    setError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (items.length === 0) {
      setError("Sua sacola está vazia.");
      return;
    }
    if (hasUnavailable) {
      setError("Remova as peças indisponíveis antes de continuar.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        shippingMethod: shippingId,
        cart: items.map((item) => ({
          productId: item.productId,
          slug: item.slug,
          quantity: item.quantity,
        })),
      }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.message ?? "Não foi possível criar o pedido.");
      return;
    }
    clear();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    router.push(`/pedido/${data.orderId}`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-4">
        <h2 className="font-serif text-2xl text-ink">Dados e entrega</h2>
        <Input label="Nome completo" value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} required />
        <Input label="E-mail" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="CPF" value={form.cpf} onChange={(e) => setField("cpf", formatCpf(e.target.value))} required />
          <Input label="Telefone" value={form.phone} onChange={(e) => setField("phone", formatPhone(e.target.value))} required />
        </div>
        <Input label="CEP" value={formatCep(form.zip)} onChange={(e) => setField("zip", e.target.value)} onBlur={onCepBlur} required />
        <Input label="Rua" value={form.street} onChange={(e) => setField("street", e.target.value)} required />
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Número" value={form.numberAddress} onChange={(e) => setField("numberAddress", e.target.value)} required />
          <Input label="Complemento" value={form.complement} onChange={(e) => setField("complement", e.target.value)} />
          <Input label="Bairro" value={form.district} onChange={(e) => setField("district", e.target.value)} required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Cidade" value={form.city} onChange={(e) => setField("city", e.target.value)} required />
          <Input label="Estado" value={form.state} onChange={(e) => setField("state", e.target.value.toUpperCase())} maxLength={2} required />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-taupe">Envio</p>
          {quotes.length === 0 ? (
            <p className="text-sm text-taupe">Informe o CEP para ver as opções reais de envio.</p>
          ) : (
            <ul className="space-y-2">
              {quotes.map((quote) => (
                <li key={quote.id}>
                  <label className="flex cursor-pointer items-center justify-between gap-4 border border-line bg-white px-4 py-3 text-sm">
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingId === quote.id}
                        onChange={() => setShippingId(quote.id)}
                      />
                      {quote.label}
                    </span>
                    <span>{formatBRL(quote.priceCents)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input label="Cupom" value={form.couponCode} onChange={(e) => setField("couponCode", e.target.value)} />
          </div>
          <button type="button" onClick={applyCoupon} className="h-12 text-[11px] uppercase tracking-[0.16em] text-burgundy">
            Aplicar
          </button>
        </div>
        {error ? <p className="text-sm text-wine">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending || items.length === 0 || hasUnavailable}>
          {pending ? "Reservando peça..." : "Ir para o pagamento"}
        </Button>
        <p className="text-xs text-taupe">
          PIX, cartão e parcelamento via Mercado Pago. Dados do cartão não são armazenados na Vesta.
        </p>
      </div>

      <aside className="h-fit border border-line bg-cream p-6 sm:p-8 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl text-ink">Seu pedido</h2>
        <p className="mt-1 text-xs text-taupe">Confira o que você está levando</p>

        {items.length === 0 ? (
          <p className="mt-6 text-sm text-taupe">Sua sacola está vazia.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((item) => {
              const available = item.stock > 0;
              const maxQty = item.uniquePiece ? 1 : Math.max(item.stock, 1);
              const canDecrease = item.quantity > 1;
              const canIncrease = !item.uniquePiece && item.quantity < item.stock;

              return (
                <li
                  key={item.productId}
                  className="flex gap-3 border-b border-line pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-sand">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={cn("h-full w-full object-cover", !available && "opacity-50 grayscale")}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-taupe">
                        Sem foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-taupe">{item.brand}</p>
                        <p className="mt-0.5 text-sm font-semibold text-ink">{item.name}</p>
                        <p className="mt-1 text-xs text-taupe">Tam. {item.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remover ${item.name}`}
                        className="shrink-0 p-1 text-taupe transition hover:text-wine"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>

                    <p
                      className={cn(
                        "mt-2 text-[11px] font-semibold uppercase tracking-[0.12em]",
                        available ? "text-ink" : "text-wine",
                      )}
                    >
                      {available
                        ? item.uniquePiece
                          ? "Disponível · peça única"
                          : `Disponível · ${item.stock} em estoque`
                        : "Indisponível"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center border border-line bg-white">
                        <button
                          type="button"
                          aria-label="Diminuir quantidade"
                          disabled={!canDecrease || !available}
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar quantidade"
                          disabled={!canIncrease || !available}
                          onClick={() => setQuantity(item.productId, Math.min(item.quantity + 1, maxQty))}
                          className="flex h-8 w-8 items-center justify-center text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-ink">
                        {formatBRL(item.priceCents * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-taupe">Subtotal</dt>
            <dd className="font-medium text-ink">{formatBRL(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-taupe">Descontos</dt>
            <dd className="font-medium text-ink">- {formatBRL(discount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-taupe">Frete</dt>
            <dd className="font-medium text-ink">{formatBRL(shipping?.priceCents ?? 0)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-bold text-ink">{formatBRL(total)}</dd>
          </div>
        </dl>
      </aside>
    </form>
  );
}
