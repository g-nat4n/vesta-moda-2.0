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
  title: "Vitrine da home",
  path: "/admin/vitrine",
  noIndex: true,
});

export default async function AdminVitrinePage() {
  let products: Awaited<ReturnType<typeof listAdminProducts>> = [];
  let dbDown = false;
  try {
    products = await listAdminProducts();
  } catch {
    dbDown = true;
  }
  const featured = products.filter((p) => p.featured);
  const available = products.filter((p) => p.status === "AVAILABLE");

  return (
    <AdminShell>
      <div>
        <p className="eyebrow">Loja</p>
        <h1 className="display mt-2 text-4xl">Vitrine da home</h1>
        <p className="mt-2 max-w-2xl text-sm text-taupe">
          Marque peças como destaque para aparecerem em Best Sellers e na tela inicial. Só produtos
          disponíveis com estoque entram nos carrosséis.
        </p>
        {!dbDown ? (
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">
            {featured.length} em destaque · {available.length} disponíveis no acervo
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
      {products.length > 0 ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const image = product.images[0];
            const onHome = product.featured && product.status === "AVAILABLE" && product.stock > 0;
            return (
              <li key={product.id}>
                <article
                  className={cn(
                    "h-full border bg-white p-2.5 shadow-[0_8px_24px_rgba(23,22,17,0.05)]",
                    product.featured ? "border-gold/60" : "border-line",
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
                    {onHome ? (
                      <span className="absolute left-2 top-2 bg-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink">
                        Na home
                      </span>
                    ) : product.featured ? (
                      <span className="absolute left-2 top-2 bg-ink/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                        Destaque (indisponível)
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
                      <input type="hidden" name="featured" value={product.featured ? "false" : "true"} />
                      <AdminMiniButton tone={product.featured ? "archive" : "restore"}>
                        {product.featured ? "Remover da home" : "Colocar na home"}
                      </AdminMiniButton>
                    </form>
                    <AdminMiniLink href={`/admin/produtos/${product.id}`}>Editar</AdminMiniLink>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}
    </AdminShell>
  );
}
