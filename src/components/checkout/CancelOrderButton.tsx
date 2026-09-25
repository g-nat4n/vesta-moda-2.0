"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function CancelOrderButton({
  orderId,
  paid,
}: {
  orderId: string;
  paid: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, pending]);

  function confirmCancel() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          credentials: "same-origin",
        });
        const data = (await res.json()) as {
          message?: string;
          refunded?: boolean;
        };
        if (!res.ok) {
          setError(data.message ?? "Não foi possível cancelar.");
          return;
        }
        const parts = ["cancelled=1"];
        if (data.refunded) parts.push("refunded=1");
        setOpen(false);
        router.push(`/pedido/${orderId}?${parts.join("&")}`);
        router.refresh();
      } catch {
        setError("Falha de rede ao cancelar o pedido.");
      }
    });
  }

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        Cancelar compra
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
          onClick={() => {
            if (!pending) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-md border border-line bg-white px-5 py-6 shadow-[0_20px_50px_rgba(23,22,17,0.18)] sm:px-6"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="cancel-order-title"
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-wine"
            >
              Cancelar compra
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {paid
                ? "Confirma o cancelamento? O valor será estornado, as peças voltam à loja e você recebe um e-mail de confirmação."
                : "Confirma o cancelamento deste pedido? Enviaremos um e-mail confirmando."}
            </p>
            {error ? <p className="mt-3 text-sm text-wine">{error}</p> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="wine"
                disabled={pending}
                className="w-full sm:w-auto"
                onClick={confirmCancel}
              >
                {pending ? "Cancelando…" : "Confirmar cancelamento"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                className="w-full sm:w-auto"
                onClick={() => setOpen(false)}
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
