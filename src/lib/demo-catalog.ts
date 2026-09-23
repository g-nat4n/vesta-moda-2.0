import { FEATURED_PIECES, type ShopPiece } from "@/lib/brand";
import type { ShopCardProduct } from "@/components/home/ShopProductCard";
import { CONDITION_LABELS } from "@/lib/constants";

export function pieceToCard(piece: ShopPiece): ShopCardProduct {
  return {
    category: piece.category,
    categorySlug: piece.categorySlug,
    rating: piece.rating,
    reviews: piece.reviews,
    compareAtCents: piece.compareAtCents,
    colors: piece.colors,
    badge: piece.badge,
    discountLabel: piece.discountLabel,
    sold: false,
    alt: piece.alt,
    item: {
      productId: piece.slug,
      slug: piece.slug,
      name: piece.name,
      brand: piece.brand,
      size: piece.size,
      priceCents: piece.priceCents,
      imageUrl: piece.image,
      uniquePiece: true,
      stock: 1,
      quantity: 1,
    },
  };
}

export function getDemoPieceBySlug(slug: string) {
  return FEATURED_PIECES.find((piece) => piece.slug === slug) ?? null;
}

export function getDemoFacets() {
  const brands = [...new Set(FEATURED_PIECES.map((p) => p.brand))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const sizes = [...new Set(FEATURED_PIECES.map((p) => p.size))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );

  const bySlug = new Map<string, string>();
  for (const piece of FEATURED_PIECES) {
    if (!bySlug.has(piece.categorySlug)) {
      bySlug.set(piece.categorySlug, piece.category);
    }
  }
  const categories = [...bySlug.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const conditions = [...new Set(FEATURED_PIECES.map((p) => p.condition))].map((value) => ({
    value,
    label: CONDITION_LABELS[value],
  }));

  return { brands, sizes, categories, conditions };
}

export function filterDemoPieces(filters: {
  q?: string;
  category?: string;
  size?: string;
  brand?: string;
  condition?: string;
  sort?: string;
}) {
  let list = [...FEATURED_PIECES];

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.style.toLowerCase().includes(q),
    );
  }
  if (filters.category) {
    list = list.filter((p) => p.categorySlug === filters.category);
  }
  if (filters.size) {
    list = list.filter((p) => p.size === filters.size);
  }
  if (filters.brand) {
    list = list.filter((p) => p.brand === filters.brand);
  }
  if (filters.condition) {
    list = list.filter((p) => p.condition === filters.condition);
  }

  if (filters.sort === "price-asc") list.sort((a, b) => a.priceCents - b.priceCents);
  else if (filters.sort === "price-desc") list.sort((a, b) => b.priceCents - a.priceCents);
  else if (filters.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return list.map(pieceToCard);
}
