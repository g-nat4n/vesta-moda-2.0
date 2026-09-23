"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImageUpload({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setPending(true);
    setMessage(null);

    let uploaded = 0;
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", productId);
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data.message ?? "Não foi possível enviar uma das imagens.");
        setPending(false);
        event.target.value = "";
        return;
      }
      uploaded += 1;
    }

    setPending(false);
    setMessage(`${uploaded} ${uploaded === 1 ? "foto enviada" : "fotos enviadas"}.`);
    event.target.value = "";
    router.refresh();
  }

  return (
    <div className="mt-6">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-taupe">
        Escolher do computador
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="mt-2 block w-full text-sm font-normal normal-case tracking-normal text-ink file:mr-3 file:border-0 file:bg-gold file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-ink"
          onChange={onChange}
          disabled={pending}
        />
      </label>
      <p className="mt-2 text-xs text-taupe">Pode selecionar várias fotos de uma vez (JPG, PNG, WEBP ou GIF, até 8 MB cada).</p>
      {pending ? <p className="mt-2 text-xs text-taupe">Enviando...</p> : null}
      {!pending && message ? <p className="mt-2 text-xs text-ink">{message}</p> : null}
    </div>
  );
}
