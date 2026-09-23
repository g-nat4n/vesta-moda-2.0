"use client";

import { motion, useReducedMotion } from "motion/react";
import { ProductCard, type ProductCardProduct } from "@/components/product/ProductCard";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { useInfiniteCatalog } from "@/components/product/useInfiniteCatalog";

export function CatalogGrid({ products }: { products: ProductCardProduct[] }) {
  const reduceMotion = useReducedMotion();
  const signature = products.map((product) => product.id).join(",");
  const { visible, loading, revealFrom, sentinelRef, hasMore } = useInfiniteCatalog(
    products.length,
    signature,
  );
  const shown = products.slice(0, visible);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:gap-6">
        {shown.map((product, index) => {
          const isNew = index >= revealFrom && revealFrom > 0;
          return (
            <motion.div
              key={product.id}
              initial={
                reduceMotion || !isNew
                  ? false
                  : { opacity: 0, y: 28, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: isNew ? (index - revealFrom) * 0.05 : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          );
        })}
      </div>
      {hasMore ? (
        <div ref={sentinelRef} className="min-h-16">
          {loading ? <BrandLoader label="Carregando mais peças" /> : <div className="h-20" aria-hidden />}
        </div>
      ) : null}
    </div>
  );
}
