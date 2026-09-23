import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories } from "@/services/category.service";
import { prisma } from "@/lib/prisma";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Nova peça", noIndex: true });

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  let looks: { id: string; name: string }[] = [];
  let dbDown = false;

  try {
    const [cats, lookRows] = await Promise.all([listCategories(), prisma.look.findMany()]);
    categories = cats.map((c) => ({ id: c.id, name: c.name }));
    looks = lookRows.map((l) => ({ id: l.id, name: l.name }));
  } catch {
    dbDown = true;
  }

  return (
    <AdminShell>
      <AdminBackLink href="/admin/produtos" label="Voltar aos produtos" />
      <p className="eyebrow">Acervo</p>
      <h1 className="display mt-2 text-4xl">Nova peça</h1>
      {dbDown ? <DbUnavailableBanner /> : <ProductForm categories={categories} looks={looks} />}
    </AdminShell>
  );
}
