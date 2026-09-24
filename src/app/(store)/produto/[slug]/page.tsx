import { notFound } from "next/navigation";
import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductStickyBuyBar } from "@/components/product/ProductStickyBuyBar";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopProductCard } from "@/components/home/ShopProductCard";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ShippingEstimator } from "@/components/product/ShippingEstimator";
import { Badge } from "@/components/ui/Badge";
import { getProductBySlug, getRelatedProducts, getSuggestedProducts } from "@/services/product.service";
import { getDemoPieceBySlug, filterDemoPieces, pieceToCard } from "@/lib/demo-catalog";
import { RelatedProductRail, RelatedRailItem } from "@/components/product/RelatedProductRail";
import { FEATURED_PIECES, type ShopPiece } from "@/lib/brand";
import { CONDITION_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { createMetadata, productJsonLd } from "@/lib/seo";
import { BuyNowButton } from "@/components/cart/BuyNowButton";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (product) {
      return createMetadata({
        title: product.name,
        description: product.description,
        path: `/produto/${product.slug}`,
        image: product.images[0]?.url,
      });
    }
  } catch {
    // DB offline — tenta peça demo
  }
  const demo = getDemoPieceBySlug(slug);
  if (!demo) return createMetadata({ title: "Peça não encontrada", noIndex: true });
  return createMetadata({
    title: demo.name,
    description: demo.description,
    path: `/produto/${demo.slug}`,
    image: demo.image,
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);
    if (product) {
      return <DbProductView product={product} />;
    }
  } catch {
    // segue para demo
  }

  const demo = getDemoPieceBySlug(slug);
  if (!demo) notFound();
  return <DemoProductView piece={demo} />;
}

async function DbProductView({
  product,
}: {
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
}) {
  const related = await getRelatedProducts({
    id: product.id,
    categoryId: product.categoryId,
    lookId: product.lookId,
    color: product.color,
    brand: product.brand,
    priceCents: product.priceCents,
  });
  let suggestions: Awaited<ReturnType<typeof getSuggestedProducts>> = [];
  try {
    suggestions = await getSuggestedProducts(
      [product.id, ...related.map((item) => item.id)],
      12,
    );
  } catch {
    suggestions = [];
  }
  const lookPieces = product.look?.products.filter((item) => item.id !== product.id) ?? [];
  const available = product.status === "AVAILABLE" && product.stock > 0;
  const measurements = (product.measurements ?? {}) as Record<string, string>;
  const jsonLd = productJsonLd({
    name: product.name,
    description: product.description,
    slug: product.slug,
    brand: product.brand,
    priceCents: product.priceCents,
    imageUrl: product.images[0]?.url,
    available,
  });

  const cartItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    size: product.size,
    priceCents: product.priceCents,
    imageUrl: product.images[0]?.url ?? null,
    uniquePiece: product.uniquePiece,
    stock: product.stock,
    quantity: 1,
  };

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto grid w-full max-w-7xl gap-5 px-0 pb-28 pt-3 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pb-20 lg:pt-12">
        <div>
          <div className="px-4 pb-3 sm:px-6 lg:hidden">
            <Link
              href="/produtos"
              className="inline-flex text-[11px] font-bold uppercase tracking-[0.14em] text-taupe transition hover:text-ink"
            >
              ← Voltar à curadoria
            </Link>
          </div>
          <ProductGallery
            images={product.images.map((image) => ({ url: image.url, alt: image.alt }))}
            name={product.name}
            sold={!available}
          />
        </div>
        <div className="px-4 sm:px-6 lg:px-0">
          <ProductDetails
            brand={product.brand}
            categoryName={product.category.name}
            name={product.name}
            uniquePiece={product.uniquePiece}
            available={available}
            stock={product.stock}
            priceCents={product.priceCents}
            size={product.size}
            color={product.color}
            condition={product.condition}
            description={product.description}
            story={product.story}
            measurements={measurements}
            cartItem={cartItem}
          />
        </div>
      </section>

      {lookPieces.length > 0 ? (
        <RelatedProductRail eyebrow="Complete o look" title={product.look?.name ?? "O look"}>
          {lookPieces.map((item) => (
            <RelatedRailItem key={item.id}>
              <ProductCard product={{ ...item, category: product.category }} />
            </RelatedRailItem>
          ))}
        </RelatedProductRail>
      ) : null}

      {related.length > 0 ? (
        <RelatedProductRail
          eyebrow="Mesma categoria e peças semelhantes"
          title="Outras peças na mesma direção"
        >
          {related.map((item) => (
            <RelatedRailItem key={item.id}>
              <ProductCard product={item} />
            </RelatedRailItem>
          ))}
        </RelatedProductRail>
      ) : null}

      {suggestions.length > 0 ? (
        <RelatedProductRail eyebrow="Para você" title="Outras sugestões">
          {suggestions.map((item) => (
            <RelatedRailItem key={item.id}>
              <ProductCard product={item} />
            </RelatedRailItem>
          ))}
        </RelatedProductRail>
      ) : null}

      <div className="pb-8 lg:pb-12" />
      <ProductStickyBuyBar item={cartItem} available={available} priceCents={product.priceCents} />
    </StoreShell>
  );
}

function DemoProductView({ piece }: { piece: ShopPiece }) {
  const related = filterDemoPieces({ category: piece.categorySlug })
    .filter((card) => card.item.slug !== piece.slug)
    .slice(0, 12);
  const suggestions = FEATURED_PIECES.filter(
    (item) => item.slug !== piece.slug && item.categorySlug !== piece.categorySlug,
  )
    .slice(0, 12)
    .map(pieceToCard);

  const jsonLd = productJsonLd({
    name: piece.name,
    description: piece.description,
    slug: piece.slug,
    brand: piece.brand,
    priceCents: piece.priceCents,
    imageUrl: piece.image,
    available: true,
  });

  const cartItem = {
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
  };

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto grid w-full max-w-7xl gap-5 px-0 pb-28 pt-3 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pb-20 lg:pt-12">
        <div>
          <div className="px-4 pb-3 sm:px-6 lg:hidden">
            <Link
              href="/produtos"
              className="inline-flex text-[11px] font-bold uppercase tracking-[0.14em] text-taupe transition hover:text-ink"
            >
              ← Voltar à curadoria
            </Link>
          </div>
          <ProductGallery
            images={(piece.gallery?.length ? piece.gallery : [piece.image]).map((url) => ({
              url,
              alt: piece.alt,
            }))}
            name={piece.name}
            sold={false}
          />
        </div>
        <div className="px-4 sm:px-6 lg:px-0">
          <ProductDetails
            brand={piece.brand}
            categoryName={piece.category}
            name={piece.name}
            uniquePiece
            available
            stock={1}
            priceCents={piece.priceCents}
            compareAtCents={piece.compareAtCents}
            size={piece.size}
            color={piece.color}
            condition={piece.condition}
            description={piece.description}
            cartItem={cartItem}
          />
        </div>
      </section>

      {related.length > 0 ? (
        <RelatedProductRail eyebrow="Mesma categoria" title="Outras peças na mesma direção">
          {related.map((card) => (
            <RelatedRailItem key={card.item.productId}>
              <ShopProductCard product={card} variant="grid" />
            </RelatedRailItem>
          ))}
        </RelatedProductRail>
      ) : null}

      {suggestions.length > 0 ? (
        <RelatedProductRail eyebrow="Para você" title="Outras sugestões">
          {suggestions.map((card) => (
            <RelatedRailItem key={card.item.productId}>
              <ShopProductCard product={card} variant="grid" />
            </RelatedRailItem>
          ))}
        </RelatedProductRail>
      ) : null}

      <div className="pb-8 lg:pb-12" />
      <ProductStickyBuyBar
        item={cartItem}
        available
        priceCents={piece.priceCents}
        compareAtCents={piece.compareAtCents}
      />
    </StoreShell>
  );
}

function ProductDetails({
  brand,
  categoryName,
  name,
  uniquePiece,
  available,
  stock,
  priceCents,
  compareAtCents,
  size,
  color,
  condition,
  description,
  story,
  measurements,
  cartItem,
}: {
  brand: string;
  categoryName: string;
  name: string;
  uniquePiece: boolean;
  available: boolean;
  stock: number;
  priceCents: number;
  compareAtCents?: number;
  size: string;
  color: string;
  condition: keyof typeof CONDITION_LABELS;
  description: string;
  story?: string | null;
  measurements?: Record<string, string>;
  cartItem: {
    productId: string;
    slug: string;
    name: string;
    brand: string;
    size: string;
    priceCents: number;
    imageUrl: string | null;
    uniquePiece: boolean;
    stock: number;
    quantity: number;
  };
}) {
  return (
    <div>
      <Link
        href="/produtos"
        className="mb-4 hidden text-[11px] font-bold uppercase tracking-[0.14em] text-taupe transition hover:text-ink lg:inline-flex"
      >
        ← Voltar à curadoria
      </Link>

      <p className="text-[11px] uppercase tracking-[0.18em] text-taupe">
        {brand} · {categoryName}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
        {name}
      </h1>

      <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
        <p className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{formatBRL(priceCents)}</p>
        {compareAtCents && compareAtCents > priceCents ? (
          <p className="text-base text-taupe line-through">{formatBRL(compareAtCents)}</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {uniquePiece ? <Badge>Peça única</Badge> : null}
        {stock === 1 && available ? <Badge tone="wine">Última unidade</Badge> : null}
        {!available ? <Badge tone="ink">Vendida</Badge> : null}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border border-line bg-cream/60 p-4 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-taupe">Tamanho</dt>
          <dd className="mt-0.5 font-medium text-ink">{size}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-taupe">Cor</dt>
          <dd className="mt-0.5 font-medium text-ink">{color}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-taupe">Condição</dt>
          <dd className="mt-0.5 font-medium text-ink">{CONDITION_LABELS[condition]}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.14em] text-taupe">Estoque</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {available ? `${stock} un.` : "Indisponível"}
          </dd>
        </div>
      </dl>

      {/* Desktop CTAs — no mobile a barra fixa cobre isso */}
      <div className="mt-6 hidden space-y-3 lg:block">
        <AddToCartButton sold={!available} item={cartItem} />
        {available ? <BuyNowButton item={cartItem} /> : null}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-taupe">{description}</p>
      {story ? <p className="mt-3 font-serif italic text-burgundy">{story}</p> : null}

      {measurements && Object.values(measurements).some(Boolean) ? (
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-taupe">Medidas aproximadas</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
            {Object.entries(measurements).map(([key, value]) =>
              value ? (
                <li key={key} className="flex justify-between border-b border-line py-2">
                  <span className="capitalize text-taupe">{labelMeasure(key)}</span>
                  <span>{value}</span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        <ShippingEstimator />
      </div>
    </div>
  );
}

function labelMeasure(key: string) {
  const labels: Record<string, string> = {
    bust: "Busto",
    waist: "Cintura",
    hip: "Quadril",
    length: "Comprimento",
    shoulder: "Ombro",
  };
  return labels[key] ?? key;
}
