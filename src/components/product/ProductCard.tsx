"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export type ProductCardProduct = Prisma.ProductGetPayload<{
  include: { images: true; category: true };
}>;

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const image = product.images[0];
  const sold = product.status !== "AVAILABLE" || product.stock <= 0;

  return (
    <article className="group h-full">
      <Link href={`/produto/${product.slug}`} className="block h-full">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
          {image ? (
            <SafeImage
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={cn("object-cover transition duration-700 group-hover:scale-[1.04]", sold && "grayscale")}
            />
          ) : null}
          {sold ? (
            <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Vendida
            </span>
          ) : null}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.uniquePiece && !sold ? (
              <span className="bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Peça única
              </span>
            ) : null}
            {product.stock === 1 && !sold ? <Badge tone="wine">Última peça</Badge> : null}
          </div>
          {!sold ? (
            <span className="absolute inset-x-0 bottom-0 translate-y-full bg-white/90 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition group-hover:translate-y-0">
              Ver peça
            </span>
          ) : null}
        </div>
        <div className="pt-3">
          <p className="flex items-center gap-1 text-xs text-ink">
            <Star className="h-3 w-3 fill-ink text-ink" />
            <span className="font-semibold">4.9</span>
            <span className="text-taupe">· Tam. {product.size}</span>
          </p>
          <h3 className="mt-1 text-sm font-bold text-ink">{product.name}</h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-taupe">{product.brand}</p>
          <p className="mt-1.5 text-sm font-bold text-ink">{formatBRL(product.priceCents)}</p>
        </div>
      </Link>
    </article>
  );
}
