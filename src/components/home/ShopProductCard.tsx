"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types";

export type ShopCardProduct = {
  item: CartItem;
  alt: string;
  category: string;
  categorySlug: string;
  rating: number;
  reviews: number;
  compareAtCents: number;
  colors: { name: string; hex: string }[];
  badge?: string;
  discountLabel?: string;
  sold: boolean;
};

function installmentLabel(cents: number, times = 8) {
  const value = Math.round(cents / times);
  return `${times}x ${formatBRL(value)}`;
}

export function ShopProductCard({
  product,
  variant = "carousel",
}: {
  product: ShopCardProduct;
  variant?: "carousel" | "grid";
}) {
  const { addItem } = useCart();
  const discount =
    product.compareAtCents > product.item.priceCents
      ? Math.round((1 - product.item.priceCents / product.compareAtCents) * 100)
      : 0;

  return (
    <article
      className={cn(
        "group",
        variant === "carousel" ? "w-[220px] shrink-0 sm:w-[240px] lg:w-[260px]" : "w-full",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        <Link href={`/produto/${product.item.slug}`} className="block h-full">
          {product.item.imageUrl ? (
            <Image
              src={product.item.imageUrl}
              alt={product.alt}
              fill
              className={cn(
                "object-cover transition duration-500 group-hover:scale-[1.03]",
                product.sold && "grayscale",
              )}
              sizes={variant === "grid" ? "(max-width: 768px) 50vw, 33vw" : "260px"}
            />
          ) : null}
        </Link>

        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {(product.discountLabel || discount > 0) && !product.sold ? (
            <span className="bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {product.discountLabel ?? `${discount}% OFF`}
            </span>
          ) : null}
          {product.badge && !product.sold ? (
            <span className="bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {product.badge}
            </span>
          ) : null}
          {product.sold ? (
            <span className="bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Esgotado
            </span>
          ) : null}
        </div>

        {!product.sold ? (
          <button
            type="button"
            className="absolute inset-x-0 bottom-0 z-10 bg-white/90 py-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-ink transition sm:translate-y-full sm:group-hover:translate-y-0"
            onClick={() => addItem(product.item)}
          >
            Compra rápida
          </button>
        ) : null}
      </div>

      <div className="pt-3">
        <p className="flex items-center gap-1 text-xs text-ink">
          <Star className="h-3 w-3 fill-ink text-ink" />
          <span className="font-semibold">{product.rating.toFixed(1)}</span>
          <span className="text-taupe">({product.reviews} reviews)</span>
        </p>
        <Link href={`/produto/${product.item.slug}`}>
          <h3 className="mt-1 text-sm font-bold text-ink transition hover:text-wine">
            {product.item.name}
          </h3>
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-bold text-ink">{formatBRL(product.item.priceCents)}</span>
          {product.compareAtCents > product.item.priceCents ? (
            <span className="text-xs text-taupe line-through">
              {formatBRL(product.compareAtCents)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-taupe">{installmentLabel(product.item.priceCents)}</p>
        {product.colors.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {product.colors.map((swatch) => (
              <span
                key={swatch.name}
                title={swatch.name}
                className="h-4 w-4 rounded-full border border-line"
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
