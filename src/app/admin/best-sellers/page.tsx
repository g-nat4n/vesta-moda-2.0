import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { listAdminProducts } from "@/services/product.service";
import { toggleFeaturedAction } from "@/app/admin/actions";
import { AdminMiniButton, AdminMiniLink } from "@/components/admin/AdminActions";
import { formatBRL } from "@/lib/format";
import { createMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = createMetadata({
  title: "Best Sellers",
  path: "/admin/best-sellers",
  noIndex: true,
});

function ProductCard({
  product,
  featured,
}: {
  product: Awaited<ReturnType<typeof listAdminProducts>>[number];
  featured: boolean;
}) {
  const image = product.images[0];
  const visible = featured && product.status === "AVAILABLE" && product.stock > 0;

  return (
    <article
      className={cn(
        "h-full border bg-white p-2.5 shadow-[0_8px_24px_rgba(23,22,17,0.05)]",
        featured ? "border-gold/60" : "border-line",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-cream">
        {image ? (
          <SafeImage
            src={image.url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : null}
        {visible ? (
          <span className="absolute left-2 top-2 bg-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink">
            No carrossel
          </span>
        ) : featured ? (
          <span className="absolute left-2 top-2 bg-ink/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
            Sem estoque
          </span>
        ) : null}
      </div>
      <div className="pt-2.5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-taupe">
          {product.category.name} · {product.brand}
        </p>
        <h2 className="mt-0.5 font-serif text-lg leading-snug text-ink">{product.name}</h2>
        <p className="mt-1 text-sm font-bold text-gold">{formatBRL(product.priceCents)}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <form action={toggleFeaturedAction}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="featured" value={featured ? "false" : "true"} />
          <AdminMiniButton tone={featured ? "archive" : "restore"}>
            {featured ? "Remover" : "Adicionar"}
          </AdminMiniButton>
        </form>
        <AdminMiniLink href={`/admin/produtos/${product.id}`}>Editar</AdminMiniLink>
      </div>
    </article>
  );
}

export default async function AdminBestSellersPage() {
  let products: Awaited<ReturnType<typeof listAdminProducts>> = [];
  let dbDown = false;
  try {
    products = await listAdminProducts();
  } catch {
    dbDown = true;
  }

  const inBestSellers = products.filter((p) => p.featured);
  const candidates = products.filter((p) => !p.featured);

  return (
    <AdminShell>
      <div>
        <p className="eyebrow">Loja</p>
        <h1 className="display mt-2 text-4xl">Best Sellers</h1>
        <p className="mt-2 max-w-2xl text-sm text-taupe">
          Escolha quais peças aparecem na home e no carrossel Best Sellers. Só entram produtos
          disponíveis com estoque.
        </p>
        {!dbDown ? (
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">
            {inBestSellers.length} em Best Sellers · {candidates.length} para adicionar
          </p>
        ) : null}
      </div>

      {dbDown ? <DbUnavailableBanner /> : null}

      {!dbDown && products.length === 0 ? (
        <p className="mt-10 text-sm text-taupe">
          Nenhuma peça cadastrada.{" "}
          <Link href="/admin/produtos/novo" className="font-semibold text-ink underline">
            Cadastre a primeira
          </Link>
          .
        </p>
      ) : null}

      {inBestSellers.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl text-ink">Na vitrine agora</h2>
          <p className="mt-1 text-sm text-taupe">Clique em Remover para tirar da home.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {inBestSellers.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} featured />
              </li>
            ))}
          </ul>
        </section>
      ) : !dbDown && products.length > 0 ? (
        <p className="mt-10 border border-dashed border-line bg-cream/60 px-4 py-6 text-sm text-taupe">
          Nenhum Best Seller ainda. Adicione peças na lista abaixo.
        </p>
      ) : null}

      {candidates.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink">Adicionar ao Best Sellers</h2>
          <p className="mt-1 text-sm text-taupe">Clique em Adicionar para colocar na home.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {candidates.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} featured={false} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AdminShell>
  );
}
