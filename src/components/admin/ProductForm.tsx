"use client";

import { useActionState } from "react";
import { saveProductAction } from "@/app/admin/actions";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CONDITION_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

type Product = Prisma.ProductGetPayload<{ include: { images: true } }>;

export function ProductForm({
  product,
  categories,
  looks,
}: {
  product?: Product;
  categories: { id: string; name: string }[];
  looks: { id: string; name: string }[];
}) {
  const measurements = (product?.measurements ?? {}) as Record<string, string>;
  const [state, formAction, pending] = useActionState(saveProductAction, null);

  return (
    <form action={formAction} className="mt-8 grid max-w-3xl gap-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {state?.error ? <p className="border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-wine">{state.error}</p> : null}
      <Input label="Nome" name="name" defaultValue={product?.name} required />
      <Textarea label="Descrição" name="description" defaultValue={product?.description} required minLength={3} />
      <Textarea label="História da peça" name="story" defaultValue={product?.story ?? ""} />
      <div className="grid gap-4 md:grid-cols-3">
        <Input label="Marca" name="brand" defaultValue={product?.brand} required />
        <Input label="Tamanho" name="size" defaultValue={product?.size} required />
        <Input label="Cor" name="color" defaultValue={product?.color} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Condição" name="condition" defaultValue={product?.condition ?? "EXCELLENT"}>
          {Object.entries(CONDITION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select label="Status" name="status" defaultValue={product?.status ?? "AVAILABLE"}>
          {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Preço (R$)"
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={product ? product.priceCents / 100 : ""}
          required
        />
        <Input
          label="De (opcional)"
          name="compareAt"
          type="number"
          step="0.01"
          defaultValue={product?.compareAtCents ? product.compareAtCents / 100 : ""}
        />
        <Input label="Estoque" name="stock" type="number" defaultValue={product?.stock ?? 1} />
      </div>
      <Select label="Categoria" name="categoryId" defaultValue={product?.categoryId} required>
        <option value="">Selecione</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select label="Look" name="lookId" defaultValue={product?.lookId ?? ""}>
        <option value="">Nenhum</option>
        {looks.map((look) => (
          <option key={look.id} value={look.id}>
            {look.name}
          </option>
        ))}
      </Select>
      <Input label="Material" name="material" defaultValue={product?.material ?? ""} />
      <Input label="URL da imagem (opcional)" name="imageUrl" defaultValue="" />
      <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-taupe">
        Fotos do computador
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="mt-2 block w-full text-sm font-normal normal-case tracking-normal text-ink file:mr-3 file:border-0 file:bg-gold file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-ink"
        />
      </label>
      <p className="text-xs text-taupe">Pode escolher várias fotos. Elas entram no acervo junto com a peça.</p>
      <div className="grid gap-4 md:grid-cols-5">
        <Input label="Busto" name="bust" defaultValue={measurements.bust} />
        <Input label="Cintura" name="waist" defaultValue={measurements.waist} />
        <Input label="Quadril" name="hip" defaultValue={measurements.hip} />
        <Input label="Comp." name="length" defaultValue={measurements.length} />
        <Input label="Ombro" name="shoulder" defaultValue={measurements.shoulder} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={product?.featured} className="mt-1" />
        <span>
          <span className="font-medium text-ink">Destaque na home</span>
          <span className="mt-0.5 block text-xs text-taupe">
            Aparece em Best Sellers e na tela inicial (quando disponível).
          </span>
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="uniquePiece" defaultChecked={product?.uniquePiece ?? true} />
        Peça única
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar peça"}
      </Button>
    </form>
  );
}
