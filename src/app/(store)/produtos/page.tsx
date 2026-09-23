import { Suspense } from "react";
import { StoreShell } from "@/components/layout/StoreShell";
import { CatalogGrid } from "@/components/product/CatalogGrid";
import { ShopCatalogGrid } from "@/components/product/ShopCatalogGrid";
import { CatalogFilters, CatalogSortBar } from "@/components/product/CatalogToolbar";
import { listPublicProducts, getCatalogFacets } from "@/services/product.service";
import { filterDemoPieces, getDemoFacets } from "@/lib/demo-catalog";
import { productFilterSchema } from "@/lib/validations";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/brand";

export const metadata = createMetadata({
  title: "Curadoria",
  description: "Explore a curadoria Vesta: peças únicas, filtros por tamanho, marca, condição e disponibilidade.",
  path: "/produtos",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type FacetsView = {
  brands: string[];
  sizes: string[];
  categories: { name: string; slug: string }[];
};

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const parsed = productFilterSchema.parse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
    size: typeof raw.size === "string" ? raw.size : undefined,
    brand: typeof raw.brand === "string" ? raw.brand : undefined,
    condition: typeof raw.condition === "string" ? raw.condition : undefined,
    availability: raw.availability === "sold" || raw.availability === "all" ? raw.availability : "available",
    min: raw.min,
    max: raw.max,
    sort: raw.sort,
  });

  let products: Awaited<ReturnType<typeof listPublicProducts>> = [];
  let facets: FacetsView = { brands: [], sizes: [], categories: [] };

  try {
    const [dbProducts, dbFacets] = await Promise.all([listPublicProducts(parsed), getCatalogFacets()]);
    products = dbProducts;
    facets = {
      brands: dbFacets.brands,
      sizes: dbFacets.sizes,
      categories: dbFacets.categories.map((c) => ({ name: c.name, slug: c.slug })),
    };
  } catch {
    products = [];
  }

  // Sem peças no banco (ou DB offline): mostra a curadoria demo da home
  const useDemo = products.length === 0;
  if (useDemo) {
    facets = getDemoFacets();
  }

  const demoCards = useDemo
    ? filterDemoPieces({
        q: parsed.q,
        category: parsed.category,
        size: parsed.size,
        brand: parsed.brand,
        condition: parsed.condition,
        sort: parsed.sort,
      })
    : [];

  const resultCount = useDemo ? demoCards.length : products.length;

  return (
    <StoreShell>
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">{BRAND.catalog.kicker}</p>
        <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.08em] text-ink sm:text-4xl">
          {BRAND.catalog.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-taupe">{BRAND.catalog.note}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <Suspense fallback={<div className="h-64 animate-pulse bg-cream" />}>
            <CatalogFilters facets={facets} current={parsed} />
          </Suspense>

          <div>
            <Suspense fallback={null}>
              <CatalogSortBar current={parsed} resultCount={resultCount} />
            </Suspense>
            {resultCount === 0 ? (
              <p className="mt-16 text-sm text-taupe">Nenhuma peça encontrada com esses filtros.</p>
            ) : useDemo ? (
              <ShopCatalogGrid products={demoCards} />
            ) : (
              <CatalogGrid products={products} />
            )}
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
