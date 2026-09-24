"use client";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatBRL } from "@/lib/format";
import type { CartItem } from "@/types";

export function ProductStickyBuyBar({
  item,
  available,
  priceCents,
  compareAtCents,
}: {
  item: CartItem;
  available: boolean;
  priceCents: number;
  compareAtCents?: number;
}) {
  if (!available) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-wine">
          Peça vendida
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 shrink-0">
          <p className="truncate text-xs text-taupe">{item.name}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="font-serif text-lg font-semibold text-ink">{formatBRL(priceCents)}</p>
            {compareAtCents && compareAtCents > priceCents ? (
              <p className="text-xs text-taupe line-through">{formatBRL(compareAtCents)}</p>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <AddToCartButton item={item} className="!min-h-11 w-full px-3 text-[10px]" />
        </div>
      </div>
    </div>
  );
}
