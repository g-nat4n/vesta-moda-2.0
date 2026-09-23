"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { RemoveCartButton } from "@/components/cart/RemoveCartButton";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, subtotalCents } = useCart();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Fechar sacola"
            className="fixed inset-0 z-40 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-ivory shadow-soft"
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Sacola"
          >
            <div className="flex items-center justify-between border-b border-gold px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-wine">Sua seleção</p>
                <h2 className="mt-1 font-serif text-2xl text-ink">Sacola Vesta</h2>
              </div>
              <button type="button" onClick={closeCart} className="p-2 text-ink" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <p className="font-serif text-xl text-ink">
                  Sua sacola está esperando uma escolha especial.
                </p>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-4 border-b border-line pb-6 last:border-b-0 last:pb-0">
                      <div className="relative h-24 w-20 overflow-hidden bg-cream">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-taupe">{item.brand}</p>
                        <p className="mt-1 text-sm">{item.name}</p>
                        <p className="mt-1 text-xs text-taupe">Tam. {item.size}</p>
                        <p className="mt-2 text-sm">{formatBRL(item.priceCents)}</p>
                      </div>
                      <RemoveCartButton onClick={() => removeItem(item.productId)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="h-3 bg-sand" aria-hidden />
            <div className="border-t border-line bg-white px-6 py-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-ink">Subtotal</span>
                <span className="font-bold text-wine">{formatBRL(subtotalCents)}</span>
              </div>
              <Button href="/checkout" className="w-full" onClick={closeCart} variant="wine">
                Finalizar compra
              </Button>
              <Link
                href="/produtos"
                onClick={closeCart}
                className="mt-3 block text-center text-[11px] uppercase tracking-[0.18em] text-taupe"
              >
                Continuar escolhendo
              </Link>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
