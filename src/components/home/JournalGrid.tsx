"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

export function JournalGrid({ expandedByDefault = false }: { expandedByDefault?: boolean }) {
  const [open, setOpen] = useState<string | null>(expandedByDefault ? BRAND.journal.articles[0].title : null);

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {BRAND.journal.articles.map((article, index) => {
        const expanded = expandedByDefault || open === article.title;
        return (
          <Reveal key={article.title} delay={index * 0.08}>
            <article className="overflow-hidden border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(23,20,17,0.08)]">
            <div className="relative h-56">
              <Image src={article.image} alt={article.alt} fill className="object-cover" />
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-taupe">{article.category}</p>
              <h3 className="mt-3 font-serif text-2xl text-ink">{article.title}</h3>
              <div className={cn("overflow-hidden transition-all", expanded ? "max-h-40" : "max-h-0")}>
                <p className="pt-4 text-sm leading-6 text-taupe">{article.text}</p>
              </div>
              {!expandedByDefault ? (
                <button
                  type="button"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ink"
                  onClick={() => setOpen(expanded ? null : article.title)}
                >
                  Ler mais
                  <ChevronDown className={cn("h-4 w-4 text-gold transition", expanded && "rotate-180")} />
                </button>
              ) : null}
            </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
