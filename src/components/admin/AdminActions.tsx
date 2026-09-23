"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const miniBase =
  "inline-flex min-h-7 items-center justify-center border bg-ivory px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.12em] no-underline transition";

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

export function ConfirmAction({
  action,
  message,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className={className} onClick={() => setOpen(true)}>
        {children}
      </div>
    );
  }

  return (
    <form action={action} className={cn("flex max-w-[16rem] flex-col gap-2", className)}>
      <p className="text-[10px] leading-relaxed text-taupe">{message}</p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] uppercase tracking-[0.14em] text-taupe transition hover:text-ink"
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
}: {
  children: React.ReactNode;
  tone?: MiniTone;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} className={miniClass(tone)}>
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
