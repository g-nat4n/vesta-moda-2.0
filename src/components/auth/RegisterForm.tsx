"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordHints } from "@/components/auth/PasswordHints";
import { passwordSchema } from "@/lib/validations/auth";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revise a senha.");
      return;
    }
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: String(form.get("email") ?? "").trim(),
        password,
        phone: form.get("phone"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPending(false);
      setError(data.message ?? "Não foi possível criar a conta.");
      return;
    }
    await signIn("credentials", {
      email: String(form.get("email") ?? "").trim(),
      password,
      callbackUrl: "/minha-conta",
    });
  }

  return (
    <div className="relative mx-auto grid min-h-[72vh] w-full max-w-5xl items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 30%, rgba(196,92,38,0.08), transparent 55%), radial-gradient(ellipse 45% 40% at 85% 70%, rgba(184,148,74,0.1), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="hidden lg:block">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">Vesta Moda</p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink">
          Crie sua conta Vesta.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-taupe">
          Guarde seu histórico de compras, acompanhe envios e finalize com mais facilidade.
        </p>
        <span className="mt-8 inline-block h-px w-14 bg-gold" aria-hidden />
      </div>

      <form
        onSubmit={onSubmit}
        className="border border-line bg-white/95 p-7 shadow-[0_16px_40px_rgba(23,22,17,0.06)] sm:p-9"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold lg:hidden">
          Vesta Moda
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink sm:text-4xl lg:mt-0">
          Criar conta
        </h1>
        <p className="mt-2 text-sm text-taupe">Preencha os dados para começar.</p>

        <div className="mt-8 space-y-4">
          <Input label="Nome" name="name" autoComplete="name" required />
          <Input label="E-mail" name="email" type="email" autoComplete="email" required />
          <Input label="Telefone" name="phone" autoComplete="tel" />
          <div>
            <Input
              label="Senha"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <PasswordHints password={password} />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-wine">{error}</p> : null}

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Criando..." : "Cadastrar"}
        </Button>

        <p className="mt-6 text-sm text-taupe">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-ink transition hover:text-gold">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
