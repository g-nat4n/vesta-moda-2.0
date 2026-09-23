"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function ContactForm() {
  const { contact } = BRAND;
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setFeedback("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        whatsapp: data.get("whatsapp"),
        message: data.get("message"),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setStatus("error");
      setFeedback(payload?.message ?? "Não foi possível enviar agora. Tente de novo em instantes.");
      return;
    }

    setStatus("ok");
    setFeedback("Mensagem recebida. A Vesta retorna em breve.");
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="border border-line bg-cream p-7 sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-ink" htmlFor="contact-name">
            {contact.name}
          </label>
          <input
            id="contact-name"
            name="name"
            required
            className="w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-ink" htmlFor="contact-email">
            {contact.email}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
        </div>
      </div>
      <div className="mt-5">
        <label className="mb-2 block text-sm font-bold text-ink" htmlFor="contact-whatsapp">
          {contact.whatsapp} <span className="font-normal text-taupe">{contact.whatsappOptional}</span>
        </label>
        <input
          id="contact-whatsapp"
          name="whatsapp"
          type="tel"
          className="w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
        />
      </div>
      <div className="mt-5">
        <label className="mb-2 block text-sm font-bold text-ink" htmlFor="contact-message">
          {contact.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          className="w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
        />
      </div>
      {feedback ? (
        <p className={`mt-4 text-sm ${status === "error" ? "text-wine" : "text-ink"}`} aria-live="polite">
          {feedback}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-wine disabled:opacity-50"
      >
        {contact.submit}
        <Send className="h-4 w-4" />
      </button>
      <p className="mt-4 text-xs leading-5 text-taupe">{contact.disclaimer}</p>
    </form>
  );
}
