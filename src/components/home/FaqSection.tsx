"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const { faq } = BRAND;
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="w-full bg-cream px-6 py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="text-center text-xl font-semibold uppercase tracking-[0.12em] text-ink sm:text-2xl">
            {faq.title}
          </h2>
        </Reveal>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {faq.items.map((item, index) => {
            const isOpen = open === index;
            return (
              <Reveal key={item.q} delay={index * 0.04}>
                <div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                  >
                    <span className="font-serif text-lg text-ink sm:text-xl">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-gold transition duration-300",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-sm leading-7 text-taupe">{item.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
