"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

const miniBase =
  "inline-flex min-h-8 items-center justify-center border bg-ivory px-2.5 py-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] no-underline transition disabled:cursor-wait disabled:opacity-60";

const miniTones = {
  edit: "border-gold/50 text-burgundy hover:border-gold hover:bg-gold hover:text-ink",
  archive: "border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-white",
  sold: "border-ink/20 text-ink hover:bg-ink hover:text-white",
  delete: "border-wine/35 text-wine hover:border-wine hover:bg-wine hover:text-white",
  restore: "border-burgundy/25 text-burgundy hover:bg-burgundy hover:text-white",
};

type MiniTone = keyof typeof miniTones;

function miniClass(tone: MiniTone) {
  return cn(miniBase, miniTones[tone]);
}

/** Confirmação em dois cliques: abre o aviso e depois envia o form. */
export function ConfirmAction({
  action,
  message,
  label,
  tone = "delete",
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  label: string;
  tone?: MiniTone;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        className={cn(miniClass(tone), className)}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <form
      className={cn("flex max-w-[16rem] flex-col gap-2", className)}
      action={(formData) => {
        startTransition(async () => {
          try {
            await action(formData);
          } finally {
            setOpen(false);
          }
        });
      }}
    >
      {children}
      <p className="text-[10px] leading-relaxed text-taupe">{message}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={miniClass(tone)} aria-busy={pending}>
          {pending ? "…" : "Confirmar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="text-[10px] uppercase tracking-[0.14em] text-taupe transition hover:text-ink disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function AdminMiniButton({
  children,
  tone = "edit",
  type = "submit",
  disabled,
}: {
  children: React.ReactNode;
  tone?: MiniTone;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} disabled={disabled} className={miniClass(tone)}>
      {children}
    </button>
  );
}

export function AdminMiniLink({
  href,
  children,
  tone = "edit",
}: {
  href: string;
  children: React.ReactNode;
  tone?: MiniTone;
}) {
  return (
    <Link href={href} className={miniClass(tone)}>
      {children}
    </Link>
  );
}
