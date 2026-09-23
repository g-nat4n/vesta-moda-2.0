import { StoreShell } from "@/components/layout/StoreShell";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { EditorialLook } from "@/components/home/EditorialLook";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { FaqSection } from "@/components/home/FaqSection";
import { ContactBand } from "@/components/home/Sections";
import { listFeaturedProducts } from "@/services/product.service";
import { BRAND, FEATURED_PIECES } from "@/lib/brand";
import { pieceToCard } from "@/lib/demo-catalog";
import { createMetadata } from "@/lib/seo";
import type { ShopCardProduct } from "@/components/home/ShopProductCard";

export const metadata = createMetadata({
  title: "Vesta Moda Pre-Owned",
  description:
    "Curadoria de peças especiais para todos os estilos, histórias e formas de se expressar.",
  path: "/",
});

type FeaturedRow = Awaited<ReturnType<typeof listFeaturedProducts>>[number];

function dbToCard(product: FeaturedRow): ShopCardProduct {
  const image = product.images[0]?.url ?? "/placeholder-product.jpg";
  const compareAt = product.compareAtCents ?? Math.round(product.priceCents * 1.25);
  return {
    category: product.category.name,
    categorySlug: product.category.slug,
    rating: 4.8,
    reviews: 12,
    compareAtCents: compareAt,
    colors: [{ name: product.color, hex: "#8B7355" }],
    badge: product.featured ? "Destaque" : undefined,
    sold: product.status !== "AVAILABLE" || product.stock <= 0,
    alt: product.name,
    item: {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      size: product.size,
      priceCents: product.priceCents,
      imageUrl: image,
      uniquePiece: product.uniquePiece,
      stock: product.stock,
      quantity: 1,
    },
  };
}

function demoCards() {
  const cards = FEATURED_PIECES.map((piece) => pieceToCard(piece));
  const bestSellers = FEATURED_PIECES.filter((p) => p.isBestSeller).map((piece) => pieceToCard(piece));
  const launches = FEATURED_PIECES.filter((p) => p.isLaunch).map((piece) => pieceToCard(piece));
  return {
    bestSellers: bestSellers.length ? bestSellers : cards,
    launches: launches.length ? launches : cards,
  };
}

export default async function HomePage() {
  let featured: FeaturedRow[] = [];
  try {
    featured = await listFeaturedProducts(24);
  } catch {
    featured = [];
  }

  const fromDb = featured.length > 0;
  const cards = fromDb ? featured.map(dbToCard) : [];
  const demo = fromDb ? null : demoCards();

  const bestSellers = fromDb ? cards : demo!.bestSellers;
  const launches = fromDb ? cards : demo!.launches;

  return (
    <StoreShell>
      <Hero />
      <TrustBar />
      <ProductCarousel
        id="best-sellers"
        title={BRAND.bestSellers.title}
        products={bestSellers}
        tabs={BRAND.bestSellers.tabs}
      />
      <CategoryTiles />
      <ProductCarousel
        id="lancamentos"
        title={BRAND.launches.title}
        products={launches.length ? launches : bestSellers}
      />
      <EditorialLook />
      <TestimonialsCarousel />
      <FaqSection />
      <ContactBand />
    </StoreShell>
  );
}
