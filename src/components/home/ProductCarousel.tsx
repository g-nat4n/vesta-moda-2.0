"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShopProductCard, type ShopCardProduct } from "@/components/home/ShopProductCard";
import { cn } from "@/lib/utils";

export function ProductCarousel({
  id,
  title,
  products,
  tabs,
}: {
  id?: string;
  title: string;
  products: ShopCardProduct[];
  tabs?: readonly string[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(tabs?.[0] ?? "");

  const visible = useMemo(() => {
    if (!tabs?.length || !tab) return products;
    const filtered = products.filter((product) => {
      const slug = product.categorySlug?.toLowerCase() ?? "";
      const name = product.category.toLowerCase();
      const t = tab.toLowerCase();
      if (t === "blazers") return slug.includes("blazer") || name.includes("blazer");
      if (t === "camisas") return slug.includes("camisa") || name.includes("camisa");
      if (t === "vestidos") return slug.includes("vestido") || name.includes("vestido");
      if (t === "sapatos") return slug.includes("sapato") || name.includes("sapato");
      if (t === "bolsas") {
        return slug.includes("bolsa") || slug.includes("acessor") || name.includes("bolsa") || name.includes("acess");
      }
      return name === t || slug === t;
    });
    return filtered.length > 0 ? filtered : products;
  }, [products, tabs, tab]);

  function scroll(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 560), behavior: "smooth" });
  }

  return (
    <section id={id} className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-xl font-semibold uppercase tracking-[0.12em] text-ink sm:text-2xl">
          {title}
        </h2>

        {tabs && tabs.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn(
                  "border-b-2 pb-1 text-sm font-medium transition",
                  tab === item
                    ? "border-gold text-ink"
                    : "border-transparent text-taupe hover:text-ink",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative mt-8">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scroll(-1)}
            className="absolute -left-1 top-1/3 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:flex lg:-left-3"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scroll(1)}
            className="absolute -right-1 top-1/3 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:flex lg:-right-3"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scroller}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visible.map((product) => (
              <ShopProductCard key={product.item.productId} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
