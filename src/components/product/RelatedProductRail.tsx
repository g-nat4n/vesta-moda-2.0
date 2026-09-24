"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function RelatedProductRail({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 560), behavior: "smooth" });
  }

  return (
    <section className="w-full bg-sand/40 py-6 lg:bg-sand/50 lg:py-10">
      <div className="mx-auto max-w-7xl px-0 lg:px-8">
        <div className="bg-white px-4 py-6 sm:px-6 lg:rounded-sm lg:border lg:border-line lg:px-8 lg:py-8 lg:shadow-[0_8px_28px_rgba(23,22,17,0.04)]">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="display mt-2 text-2xl lg:text-3xl">{title}</h2>

          <div className="relative mt-6">
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scroll(-1)}
              className="absolute -left-3 top-[28%] z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_6px_20px_rgba(23,22,17,0.14)] transition hover:border-gold hover:text-gold lg:flex xl:-left-5"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Próximo"
              onClick={() => scroll(1)}
              className="absolute -right-3 top-[28%] z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_6px_20px_rgba(23,22,17,0.14)] transition hover:border-gold hover:text-gold lg:flex xl:-right-5"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>

            <div
              ref={scroller}
              className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 lg:gap-5 [&::-webkit-scrollbar]:hidden"
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RelatedRailItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[42vw] max-w-[220px] shrink-0 snap-start sm:w-[200px] lg:w-[220px] lg:max-w-none xl:w-[240px]">
      {children}
    </div>
  );
}
