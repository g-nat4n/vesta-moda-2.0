import { AdminShell } from "@/components/admin/AdminShell";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { listCategories } from "@/services/category.service";
import { saveCategoryAction, toggleCategoryAction, deleteCategoryAction } from "@/app/admin/actions";
import { AdminMiniButton, ConfirmAction } from "@/components/admin/AdminActions";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let dbDown = false;
  try {
    categories = await listCategories();
  } catch {
    dbDown = true;
  }

  return (
    <AdminShell>
      <p className="eyebrow">Taxonomia</p>
      <h1 className="display mt-2 text-4xl">Categorias</h1>
      <p className="mt-2 max-w-xl text-sm text-taupe">
        Desative para esconder na loja. Só exclua se não houver peças na categoria.
      </p>
      {dbDown ? <DbUnavailableBanner /> : null}
      {aviso ? (
        <p className="mt-6 border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-wine">{aviso}</p>
      ) : null}
      {!dbDown ? (
      <form action={saveCategoryAction} className="mt-8 grid max-w-xl gap-3 border border-line bg-white p-6">
        <Input label="Nome" name="name" required />
        <Textarea label="Descrição" name="description" />
        <Input label="Imagem URL" name="imageUrl" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Ativa na loja
        </label>
        <Button type="submit">Criar categoria</Button>
      </form>
      ) : null}
      <ul className="mt-10 grid max-w-3xl gap-4">
        {categories.map((category) => (
          <li key={category.id} className="border border-line bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-serif text-2xl">{category.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-taupe">
                  {category.active ? "Ativa na loja" : "Desativada"} · {category._count.products}{" "}
                  {category._count.products === 1 ? "peça" : "peças"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <form action={toggleCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="active" value={category.active ? "false" : "true"} />
                  <AdminMiniButton tone={category.active ? "archive" : "restore"}>
                    {category.active ? "Desativar" : "Ativar"}
                  </AdminMiniButton>
                </form>
                <ConfirmAction
                  action={deleteCategoryAction}
                  label="Excluir"
                  tone="delete"
                  message={
                    category._count.products > 0
                      ? "Esta categoria ainda tem peças. O sistema não exclui para não quebrar o acervo."
                      : "Excluir esta categoria?"
                  }
                >
                  <input type="hidden" name="id" value={category.id} />
                </ConfirmAction>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
