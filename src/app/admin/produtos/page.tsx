import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { listAdminProducts } from "@/services/product.service";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import {
  archiveProductAction,
  deleteProductAction,
  markSoldAction,
  restoreProductAction,
  toggleFeaturedAction,
} from "@/app/admin/actions";
import { AdminMiniButton, AdminMiniLink, ConfirmAction } from "@/components/admin/AdminActions";
import { Button } from "@/components/ui/Button";
import { createMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = createMetadata({ title: "Produtos", path: "/admin/produtos", noIndex: true });

const statusTone: Record<string, string> = {
  AVAILABLE: "border-ink/30 bg-ink/10 text-ink",
  SOLD: "border-ink/20 bg-ink text-white",
  ARCHIVED: "border-line bg-sand text-taupe",
  RESERVED: "border-gold/40 bg-gold/15 text-burgundy",
  DRAFT: "border-line bg-cream text-taupe",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  let products: Awaited<ReturnType<typeof listAdminProducts>> = [];
  let dbDown = false;
  try {
    products = await listAdminProducts();
  } catch {
    dbDown = true;
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Acervo</p>
          <h1 className="display mt-2 text-4xl">Produtos</h1>
          <p className="mt-2 max-w-xl text-sm text-taupe">
            Passe o mouse na peça para destacar. Use vender, arquivar ou excluir sem abrir a edição.
          </p>
        </div>
        <Button href="/admin/produtos/novo">Nova peça</Button>
      </div>
      {dbDown ? <DbUnavailableBanner /> : null}
      {aviso ? (
        <p className="mt-6 border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-wine">{aviso}</p>
      ) : null}
      {!dbDown && products.length === 0 ? (
        <p className="mt-10 text-sm text-taupe">Nenhuma peça cadastrada ainda.</p>
      ) : null}
      {products.length > 0 ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const image = product.images[0];
            const sold = product.status === "SOLD";
            return (
              <li key={product.id}>
                <article className="group h-full border border-line bg-white p-2.5 shadow-[0_8px_24px_rgba(23,22,17,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_12px_28px_rgba(64,8,2,0.1)]">
                  <Link href={`/admin/produtos/${product.id}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                      {image ? (
                        <SafeImage
                          src={image.url}
                          alt={product.name}
                          fill
                          className={cn(
                            "object-cover transition duration-500 group-hover:scale-[1.04]",
                            sold && "grayscale",
                          )}
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : null}
                      {sold ? (
                        <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                          Vendida
                        </span>
                      ) : null}
                      {product.featured ? (
                        <span className="absolute left-2 top-2 bg-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink">
                          Home
                        </span>
                      ) : null}
                    </div>
                    <div className="pt-2.5">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-taupe">
                        {product.brand} · Tam. {product.size}
                      </p>
                      <h2 className="mt-0.5 font-serif text-lg leading-snug text-ink group-hover:text-burgundy">{product.name}</h2>
                      <p className="mt-1 text-sm font-bold text-gold">{formatBRL(product.priceCents)}</p>
                      <span
                        className={cn(
                          "mt-2 inline-flex border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]",
                          statusTone[product.status] ?? statusTone.DRAFT,
                        )}
                      >
                        {PRODUCT_STATUS_LABELS[product.status]}
                      </span>
                    </div>
                  </Link>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <AdminMiniLink href={`/admin/produtos/${product.id}`}>Editar</AdminMiniLink>
                    <form action={toggleFeaturedAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="featured" value={product.featured ? "false" : "true"} />
                      <AdminMiniButton tone={product.featured ? "archive" : "restore"}>
                        {product.featured ? "Tirar da home" : "Na home"}
                      </AdminMiniButton>
                    </form>
                    {product.status === "AVAILABLE" ? (
                      <ConfirmAction
                        action={markSoldAction}
                        label="Vendida"
                        tone="sold"
                        message="Marcar esta peça como vendida? Ela aparece vendida na loja."
                      >
                        <input type="hidden" name="id" value={product.id} />
                      </ConfirmAction>
                    ) : null}
                    {product.status !== "ARCHIVED" ? (
                      <form action={archiveProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <AdminMiniButton tone="archive">Arquivar</AdminMiniButton>
                      </form>
                    ) : (
                      <form action={restoreProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <AdminMiniButton tone="restore">Disponibilizar</AdminMiniButton>
                      </form>
                    )}
                    {sold ? (
                      <form action={restoreProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <AdminMiniButton tone="restore">Reabrir</AdminMiniButton>
                      </form>
                    ) : null}
                    <ConfirmAction
                      action={deleteProductAction}
                      label="Excluir"
                      tone="delete"
                      message="Excluir esta peça de vez? Se ela já entrou em um pedido, o sistema pede para arquivar."
                    >
                      <input type="hidden" name="id" value={product.id} />
                    </ConfirmAction>
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
