import { notFound } from "next/navigation";
import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopProductCard } from "@/components/home/ShopProductCard";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ShippingEstimator } from "@/components/product/ShippingEstimator";
import { Badge } from "@/components/ui/Badge";
import { getProductBySlug, getRelatedProducts } from "@/services/product.service";
import { getDemoPieceBySlug, filterDemoPieces } from "@/lib/demo-catalog";
import { CONDITION_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { createMetadata, productJsonLd } from "@/lib/seo";
import { BuyNowButton } from "@/components/cart/BuyNowButton";
import type { ShopPiece } from "@/lib/brand";

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

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container-main grid gap-12 py-12 lg:grid-cols-2 lg:py-20">
        <ProductGallery
          images={product.images.map((image) => ({ url: image.url, alt: image.alt }))}
          name={product.name}
          sold={!available}
        />
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
          cartItem={{
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
          }}
        />
      </section>

      {lookPieces.length > 0 ? (
        <section className="container-main pb-16">
          <p className="eyebrow">Complete o look</p>
          <h2 className="display mt-2 text-3xl">{product.look?.name}</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {lookPieces.map((item) => (
              <ProductCard key={item.id} product={{ ...item, category: product.category }} />
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="container-main pb-24">
          <p className="eyebrow">Mesma categoria e peças semelhantes</p>
          <h2 className="display mt-2 text-3xl">Outras peças na mesma direção</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </StoreShell>
  );
}

function DemoProductView({ piece }: { piece: ShopPiece }) {
  const related = filterDemoPieces({ category: piece.categorySlug }).filter(
    (card) => card.item.slug !== piece.slug,
  );
  const jsonLd = productJsonLd({
    name: piece.name,
    description: piece.description,
    slug: piece.slug,
    brand: piece.brand,
    priceCents: piece.priceCents,
    imageUrl: piece.image,
    available: true,
  });

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container-main grid gap-12 py-12 lg:grid-cols-2 lg:py-20">
        <ProductGallery images={[{ url: piece.image, alt: piece.alt }]} name={piece.name} sold={false} />
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
          cartItem={{
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
          }}
        />
      </section>

      {related.length > 0 ? (
        <section className="container-main pb-24">
          <p className="eyebrow">Mesma categoria</p>
          <h2 className="display mt-2 text-3xl">Outras peças na mesma direção</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {related.slice(0, 4).map((card) => (
              <ShopProductCard key={card.item.productId} product={card} variant="grid" />
            ))}
          </div>
          <Link
            href={`/produtos?category=${piece.categorySlug}`}
            className="mt-8 inline-block text-sm font-bold uppercase tracking-[0.16em] text-ink underline decoration-gold decoration-2 underline-offset-8"
          >
            Ver mais em {piece.category}
          </Link>
        </section>
      ) : null}
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
      <p className="text-[11px] uppercase tracking-[0.22em] text-taupe">
        {brand} · {categoryName}
      </p>
      <h1 className="display mt-3 text-4xl md:text-5xl">{name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {uniquePiece ? <Badge>Peça única</Badge> : null}
        {stock === 1 && available ? <Badge tone="wine">Última unidade disponível</Badge> : null}
        {!available ? <Badge tone="ink">Vendida</Badge> : null}
      </div>
      <div className="mt-6 flex flex-wrap items-baseline gap-3">
        <p className="font-serif text-3xl font-semibold text-ink">{formatBRL(priceCents)}</p>
        {compareAtCents && compareAtCents > priceCents ? (
          <p className="text-lg text-taupe line-through">{formatBRL(compareAtCents)}</p>
        ) : null}
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-taupe">Tamanho</dt>
          <dd className="mt-1">{size}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-taupe">Cor</dt>
          <dd className="mt-1">{color}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-taupe">Condição</dt>
          <dd className="mt-1">{CONDITION_LABELS[condition]}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-taupe">Estoque</dt>
          <dd className="mt-1">
            {available ? `${stock} unidade${stock > 1 ? "s" : ""}` : "Indisponível"}
          </dd>
        </div>
      </dl>
      <p className="mt-8 text-sm leading-relaxed text-taupe">{description}</p>
      {story ? <p className="mt-4 font-serif italic text-burgundy">{story}</p> : null}
      {measurements && Object.values(measurements).some(Boolean) ? (
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-taupe">Medidas aproximadas</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
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
      <div className="mt-8 space-y-3">
        <AddToCartButton sold={!available} item={cartItem} />
        {available ? <BuyNowButton item={cartItem} /> : null}
      </div>
      <div className="mt-8">
        <ShippingEstimator />
      </div>
      <Link
        href="/produtos"
        className="mt-8 inline-block text-xs font-bold uppercase tracking-[0.16em] text-taupe hover:text-ink"
      >
        ← Voltar à curadoria
      </Link>
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
