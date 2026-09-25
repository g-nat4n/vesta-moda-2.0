"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmAction } from "@/components/admin/AdminActions";
import { refundOrderAction } from "@/app/admin/actions";

export function RefundOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-6 max-w-md space-y-2">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-taupe">
        Reembolso
      </p>
      {error ? <p className="text-sm text-wine">{error}</p> : null}
      <ConfirmAction
        tone="delete"
        label="Reembolsar compra"
        message={`Confirma o estorno total do pedido ${orderNumber}? O valor volta pelo Mercado Pago e as peças voltam ao estoque.`}
        action={async (formData) => {
          setError(null);
          const result = await refundOrderAction(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
      >
        <input type="hidden" name="id" value={orderId} />
      </ConfirmAction>
    </div>
  );
}
