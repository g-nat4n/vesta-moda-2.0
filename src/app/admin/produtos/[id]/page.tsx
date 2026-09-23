import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/services/product.service";
import { listCategories } from "@/services/category.service";
import { prisma } from "@/lib/prisma";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  addImageByUrlAction,
  archiveProductAction,
  deleteProductAction,
  deleteProductImageAction,
  markSoldAction,
} from "@/app/admin/actions";
import { AdminMiniButton, ConfirmAction } from "@/components/admin/AdminActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  let product: Awaited<ReturnType<typeof getProductById>> = null;
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let looks: { id: string; name: string }[] = [];
  let dbDown = false;

  try {
    const [p, cats, lookRows] = await Promise.all([
      getProductById(id),
      listCategories(),
      prisma.look.findMany(),
    ]);
    product = p;
    categories = cats;
    looks = lookRows;
  } catch {
    dbDown = true;
  }

  if (dbDown) {
    return (
      <AdminShell>
        <AdminBackLink href="/admin/produtos" label="Voltar aos produtos" />
        <p className="eyebrow">Acervo</p>
        <h1 className="display mt-2 text-4xl">Editar peça</h1>
        <DbUnavailableBanner />
      </AdminShell>
    );
  }

  if (!product) notFound();

  return (
    <AdminShell>
      <AdminBackLink href="/admin/produtos" label="Voltar aos produtos" />
      <p className="eyebrow">Acervo</p>
      <h1 className="display mt-2 text-4xl">Editar peça</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {product.status === "AVAILABLE" ? (
          <ConfirmAction action={markSoldAction} message="Marcar esta peça como vendida?">
            <input type="hidden" name="id" value={product.id} />
            <AdminMiniButton tone="sold">Marcar vendida</AdminMiniButton>
          </ConfirmAction>
        ) : null}
        <form action={archiveProductAction}>
          <input type="hidden" name="id" value={product.id} />
          <AdminMiniButton tone="archive">Arquivar</AdminMiniButton>
        </form>
        <ConfirmAction action={deleteProductAction} message="Excluir esta peça de vez?">
          <input type="hidden" name="id" value={product.id} />
          <AdminMiniButton tone="delete">Excluir</AdminMiniButton>
        </ConfirmAction>
      </div>
      <ProductForm product={product} categories={categories} looks={looks} />
      <section className="mt-12 max-w-3xl">
        <h2 className="display text-2xl">Imagens</h2>
        <p className="mt-2 text-sm text-taupe">A primeira foto é a principal na loja. Pode adicionar quantas quiser.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {product.images.map((image, index) => (
            <div key={image.id} className="relative aspect-[3/4] bg-cream">
              <SafeImage src={image.url} alt={image.alt} fill className="object-cover" />
              <span className="absolute left-2 top-2 bg-ivory/90 px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
                {index === 0 ? "Principal" : `${index + 1}`}
              </span>
              <form action={deleteProductImageAction} className="absolute bottom-2 right-2">
                <input type="hidden" name="imageId" value={image.id} />
                <input type="hidden" name="productId" value={product.id} />
                <button type="submit" className="bg-wine px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white">
                  Remover
                </button>
              </form>
            </div>
          ))}
        </div>
        <ImageUpload productId={product.id} />
        <form action={addImageByUrlAction} className="mt-6 space-y-3">
          <input type="hidden" name="productId" value={product.id} />
          <Input label="Ou cole uma URL de imagem" name="url" />
          <Button type="submit" variant="ghost">
            Adicionar URL
          </Button>
        </form>
      </section>
    </AdminShell>
  );
}
