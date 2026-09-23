"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/brand";
import { formatBrandPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types";

export type CuradoriaCard = {
  item: CartItem;
  meta: string;
  category: string;
  style: string;
  sold: boolean;
  alt: string;
};

export function FeaturedCuradoria({ products }: { products: CuradoriaCard[] }) {
  const { catalog } = BRAND;
  const [favorites, setFavorites] = useState<string[]>([]);

  return (
    <section id="curadoria" className="w-full bg-ivory px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">{catalog.kicker}</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl lg:text-5xl">
                {catalog.title}
              </h2>
              <p className="mt-2 text-sm text-taupe">{catalog.note}</p>
            </div>
            <Link
              href="/produtos"
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink underline decoration-gold decoration-2 underline-offset-8 transition hover:text-gold"
            >
              {catalog.cta}
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const liked = favorites.includes(product.item.productId);
            return (
              <motion.article
                key={product.item.productId}
                className="product-card group"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.55, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                  <Link href={`/produto/${product.item.slug}`} className="block h-full">
                    {product.item.imageUrl ? (
                      <Image
                        src={product.item.imageUrl}
                        alt={product.alt}
                        fill
                        className={cn(
                          "object-cover transition duration-700 group-hover:scale-[1.04]",
                          product.sold && "grayscale",
                        )}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : null}
                  </Link>
                  {product.sold ? (
                    <span className="absolute left-3 top-3 z-10 bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      Vendida
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={cn(
                      "absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2.5 text-ink transition hover:text-wine",
                      liked && "text-wine",
                    )}
                    aria-label={`Favoritar ${product.item.name}`}
                    onClick={() =>
                      setFavorites((current) =>
                        current.includes(product.item.productId)
                          ? current.filter((id) => id !== product.item.productId)
                          : [...current, product.item.productId],
                      )
                    }
                  >
                    <Heart className={cn("h-4 w-4", liked && "fill-wine")} />
                  </button>
                </div>
                <div className="pt-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-taupe">{product.meta}</p>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <Link href={`/produto/${product.item.slug}`}>
                      <h3 className="font-serif text-xl text-ink transition group-hover:text-wine">
                        {product.item.name}
                      </h3>
                    </Link>
                    <p className="shrink-0 text-sm font-bold text-ink">
                      {formatBrandPrice(product.item.priceCents)}
                    </p>
                  </div>
                  <div className="mt-4">
                    <AddToCartButton
                      sold={product.sold}
                      item={product.item}
                      className="min-h-0 w-full border border-ink bg-ink py-3 text-sm font-bold normal-case tracking-normal text-white hover:bg-white hover:text-ink"
                    />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
