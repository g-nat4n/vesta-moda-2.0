"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function TestimonialsCarousel() {
  const { testimonials } = BRAND;
  const [index, setIndex] = useState(0);
  const total = testimonials.items.length;
  const go = (next: number) => setIndex((next + total) % total);

  return (
    <section className="w-full bg-cream px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-4xl overflow-hidden">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
          {testimonials.kicker}
        </p>
        <h2 className="mt-3 text-center font-serif text-3xl text-ink sm:text-4xl">
          {testimonials.title}
        </h2>
        <div className="mt-10 overflow-hidden">
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {testimonials.items.map((item) => (
              <blockquote key={item.author} className="w-full shrink-0 px-2 text-center">
                <p className="font-serif text-xl leading-relaxed text-ink sm:text-2xl">
                  “{item.quote}”
                </p>
                <footer className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-taupe">
                  {item.author}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Depoimento anterior"
            className="border border-line p-2.5 text-ink transition hover:border-ink"
            onClick={() => go(index - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo depoimento"
            className="bg-ink p-2.5 text-white transition hover:bg-wine"
            onClick={() => go(index + 1)}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
