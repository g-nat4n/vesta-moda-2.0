"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CancelledOrderActions({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();

  return (
    <div className="mt-10 flex flex-wrap gap-3">
      <Button type="button" variant="ghost" onClick={() => router.back()}>
        Voltar
      </Button>
      {loggedIn ? (
        <Button href="/minha-conta" variant="burgundy">
          Ver meus pedidos
        </Button>
      ) : (
        <Button href="/produtos" variant="burgundy">
          Continuar na loja
        </Button>
      )}
    </div>
  );
}
