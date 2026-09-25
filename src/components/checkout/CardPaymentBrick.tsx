"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";

type Props = {
  orderId: string;
  amount: number;
  email: string;
  publicKey: string;
  accessToken?: string | null;
};

type BrickFormData = {
  token: string;
  payment_method_id: string;
  installments: number;
  issuer_id?: string;
  payer?: {
    email?: string;
    identification?: { type?: string; number?: string };
  };
};

export function CardPaymentBrick({ orderId, amount, email, publicKey, accessToken }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current || !publicKey) return;
    inited.current = true;
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setReady(true);
  }, [publicKey]);

  async function onSubmit(formData: BrickFormData) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          token: formData.token,
          paymentMethodId: formData.payment_method_id,
          installments: formData.installments,
          issuerId: formData.issuer_id || null,
          payerEmail: formData.payer?.email || email,
          payerIdentification: formData.payer?.identification ?? null,
          access: accessToken || undefined,
        }),
      });
      const data = (await res.json()) as {
        status?: string;
        statusDetail?: string;
        message?: string;
      };

      if (!res.ok) {
        setError(data.message ?? "Não foi possível processar o pagamento.");
        setSubmitting(false);
        return;
      }

      if (data.status === "approved") {
        const q = accessToken
          ? `?result=success&access=${encodeURIComponent(accessToken)}`
          : "?result=success";
        router.push(`/pedido/${orderId}${q}`);
        return;
      }
      if (data.status === "rejected" || data.status === "cancelled") {
        setError(
          data.message ??
            "Pagamento recusado. No teste, use nome APRO e CPF 12345678909.",
        );
        setSubmitting(false);
        return;
      }
      const pendingQ = accessToken
        ? `?result=pending&access=${encodeURIComponent(accessToken)}`
        : "?result=pending";
      router.push(`/pedido/${orderId}${pendingQ}`);
    } catch {
      setError("Falha de rede ao processar o pagamento.");
      setSubmitting(false);
    }
  }

  if (!publicKey) {
    return (
      <p className="border border-wine/30 bg-white/70 px-4 py-3 text-sm text-wine">
        Chave pública do Mercado Pago não configurada (
        <code className="text-xs">NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY</code>).
      </p>
    );
  }

  return (
    <div className="relative">
      {error ? (
        <p className="mb-4 border border-wine/30 bg-white/70 px-4 py-3 text-sm text-wine">
          {error}
        </p>
      ) : null}
      {submitting ? (
        <p className="mb-4 text-sm text-taupe">Processando pagamento…</p>
      ) : null}
      {ready ? (
        <CardPayment
          locale="pt-BR"
          initialization={{
            amount,
            payer: { email },
          }}
          customization={{
            paymentMethods: {
              maxInstallments: 12,
            },
          }}
          onSubmit={onSubmit}
          onError={() => {
            setError("Não foi possível carregar o formulário de cartão.");
          }}
        />
      ) : (
        <p className="text-sm text-taupe">Carregando formulário de pagamento…</p>
      )}
    </div>
  );
}
