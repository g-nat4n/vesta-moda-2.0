"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const ERRORS: Record<string, string> = {
  locked: "Muitas tentativas. Aguarde 1 minuto e tente de novo.",
  email: "Este e-mail não possui cadastro.",
  password: "Senha incorreta.",
  CredentialsSignin: "Não foi possível entrar. Confira o e-mail e a senha.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [notice] = useState(
    params.get("reset") === "ok" ? "Senha atualizada. Entre com a nova senha." : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      const code = "code" in result && typeof result.code === "string" ? result.code : result.error;
      setError(ERRORS[code] ?? ERRORS.CredentialsSignin);
      return;
    }

    const session = await getSession();
    const callback = params.get("callbackUrl");
    if (session?.user?.role === "ADMIN") {
      router.push(callback?.startsWith("/admin") ? callback : "/admin");
    } else {
      router.push(callback || "/minha-conta");
    }
    router.refresh();
  }

  return (
    <div className="relative mx-auto grid min-h-[72vh] w-full max-w-5xl items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 10% 20%, rgba(196,92,38,0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(184,148,74,0.1), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="hidden lg:block">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">Vesta Moda</p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink">
          Bem-vinda de volta.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-taupe">
          Entre para acompanhar pedidos, favoritos e finalizar compras com mais agilidade.
        </p>
        <span className="mt-8 inline-block h-px w-14 bg-gold" aria-hidden />
      </div>

      <form
        onSubmit={onSubmit}
        className="border border-line bg-white/95 p-7 shadow-[0_16px_40px_rgba(23,22,17,0.06)] sm:p-9"
        autoComplete="on"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold lg:hidden">
          Vesta Moda
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink sm:text-4xl lg:mt-0">Entrar</h1>
        <p className="mt-2 text-sm text-taupe">Use o e-mail e a senha da sua conta.</p>

        <div className="mt-8 space-y-4">
          <Input label="E-mail" name="email" type="email" autoComplete="email" required />
          <Input label="Senha" name="password" type="password" autoComplete="current-password" required />
        </div>

        {notice ? <p className="mt-4 text-sm text-ink">{notice}</p> : null}
        {error ? <p className="mt-4 text-sm text-wine">{error}</p> : null}

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>

        <div className="mt-6 space-y-2 text-sm text-taupe">
          <p>
            <Link href="/recuperar-senha" className="font-semibold text-ink transition hover:text-gold">
              Esqueci a senha
            </Link>
          </p>
          <p>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-ink transition hover:text-gold">
              Criar cadastro
            </Link>
          </p>
          <p className="pt-2 text-xs text-taupe/80">
            Equipe Vesta? Após entrar, você vai direto ao atelier.
          </p>
        </div>
      </form>
    </div>
  );
}
