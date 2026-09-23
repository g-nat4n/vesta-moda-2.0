"use client";

import { PASSWORD_HINT } from "@/lib/validations/auth";

export function PasswordHints({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8, label: "8 caracteres" },
    { ok: /[A-Z]/.test(password), label: "1 maiúscula" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "1 caractere especial" },
  ];

  return (
    <ul className="mt-2 space-y-1 text-[11px] uppercase tracking-[0.12em] text-taupe">
      <li className="normal-case tracking-normal text-taupe">{PASSWORD_HINT}</li>
      {checks.map((item) => (
        <li key={item.label} className={item.ok ? "text-ink" : "text-taupe"}>
          {item.ok ? "●" : "○"} {item.label}
        </li>
      ))}
    </ul>
  );
}
