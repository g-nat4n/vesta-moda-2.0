"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") ?? "").trim() }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.message ?? "Não foi possível enviar o e-mail.");
      return;
    }
    setOk(true);
  }

  if (ok) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20">
        <p className="eyebrow">Recuperar senha</p>
        <h1 className="display text-4xl">E-mail enviado</h1>
        <p className="text-sm text-taupe">Enviamos o link se este e-mail estiver cadastrado. Ele vale por 30 minutos.</p>
        <Link href="/login" className="inline-block text-[11px] uppercase tracking-[0.16em] text-burgundy">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 py-20">
      <p className="eyebrow">Recuperar senha</p>
      <h1 className="display text-4xl">Esqueceu a senha?</h1>
      <p className="text-sm text-taupe">
        Informe o e-mail da sua conta. Se ele existir, enviamos o link de redefinição.
      </p>
      <Input label="E-mail" name="email" type="email" autoComplete="email" required />
      {error ? <p className="text-sm text-wine">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
      <Link href="/login" className="inline-block text-sm text-burgundy">
        Voltar ao login
      </Link>
    </form>
  );
}
