"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus, ProductStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { productFormSchema, categoryFormSchema } from "@/lib/validations";
import {
  upsertProduct,
  addProductImage,
  deleteProductImage,
  deleteProduct,
  setProductFeatured,
} from "@/services/product.service";
import { prisma } from "@/lib/prisma";
import { upsertCategory, deleteCategory, toggleCategory } from "@/services/category.service";
import { updateOrderStatus } from "@/services/order.service";
import { storeProductPhoto } from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    throw new Error("Não autorizado");
  }
}

export async function saveProductAction(_prev: { error?: string } | null, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const compareAt = String(formData.get("compareAt") || "").trim();
  const parsed = productFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    story: String(formData.get("story") || "") || undefined,
    brand: String(formData.get("brand") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim(),
    color: String(formData.get("color") ?? "").trim(),
    condition: String(formData.get("condition") ?? "EXCELLENT"),
    priceCents: Math.round(Number(formData.get("price")) * 100),
    compareAtCents: compareAt ? Math.round(Number(compareAt) * 100) : null,
    stock: Number(formData.get("stock") || 1),
    status: String(formData.get("status") ?? "AVAILABLE"),
    featured: formData.get("featured") === "on",
    uniquePiece: formData.get("uniquePiece") === "on",
    material: String(formData.get("material") || "") || undefined,
    categoryId: String(formData.get("categoryId") ?? ""),
    lookId: String(formData.get("lookId") || "") || null,
    imageUrl: String(formData.get("imageUrl") || "") || undefined,
    measurements: {
      bust: String(formData.get("bust") || "") || undefined,
      waist: String(formData.get("waist") || "") || undefined,
      hip: String(formData.get("hip") || "") || undefined,
      length: String(formData.get("length") || "") || undefined,
      shoulder: String(formData.get("shoulder") || "") || undefined,
    },
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados da peça." };
  }

  try {
    const product = await upsertProduct(parsed.data, id || undefined);
    const photos = formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
    for (const file of photos) {
      const stored = await storeProductPhoto(file);
      await addProductImage(product.id, stored.url, parsed.data.name, stored.publicId);
    }
    revalidatePath("/admin/produtos");
    revalidatePath(`/admin/produtos/${product.id}`);
    revalidatePath("/admin/vitrine");
    revalidatePath("/produtos");
    revalidatePath("/");
    redirect(`/admin/produtos/${product.id}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Não foi possível salvar a peça.";
    return { error: message };
  }
}

function revalidateStore() {
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
}

async function revalidateProductById(id: string) {
  revalidateStore();
  const product = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  if (product?.slug) revalidatePath(`/produto/${product.slug}`);
}

export async function archiveProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.ARCHIVED },
  });
  await revalidateProductById(id);
}

export async function restoreProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const product = await prisma.product.findUnique({ where: { id } });
  await prisma.product.update({
    where: { id },
    data: {
      status: ProductStatus.AVAILABLE,
      stock: product && product.stock < 1 ? 1 : product?.stock,
    },
  });
  await revalidateProductById(id);
}

export async function markSoldAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.SOLD, stock: 0 },
  });
  await revalidateProductById(id);
}

export async function toggleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const featured = formData.get("featured") === "true";
  await setProductFeatured(id, featured);
  revalidatePath("/admin/vitrine");
  revalidatePath("/admin/produtos");
  revalidatePath("/");
  revalidatePath("/produtos");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  try {
    await deleteProduct(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível excluir a peça.";
    redirect(`/admin/produtos?aviso=${encodeURIComponent(message)}`);
  }
  revalidateStore();
  redirect("/admin/produtos");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const parsed = categoryFormSchema.parse({
    name: formData.get("name"),
    description: String(formData.get("description") || "") || undefined,
    imageUrl: String(formData.get("imageUrl") || ""),
    active: formData.get("active") === "on",
  });
  await upsertCategory(parsed, id || undefined);
  revalidatePath("/admin/categorias");
}

export async function toggleCategoryAction(formData: FormData) {
  await requireAdmin();
  await toggleCategory(String(formData.get("id")), formData.get("active") === "true");
  revalidatePath("/admin/categorias");
  revalidatePath("/");
  revalidatePath("/produtos");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  try {
    await deleteCategory(String(formData.get("id")));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível excluir a categoria.";
    redirect(`/admin/categorias?aviso=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  await updateOrderStatus(String(formData.get("id")), String(formData.get("status")) as OrderStatus);
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${String(formData.get("id"))}`);
}

export async function addImageByUrlAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  const url = String(formData.get("url"));
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !url) return;
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: {
      productId,
      url,
      alt: product.name,
      kind: count === 0 ? "MAIN" : "DETAIL",
      sortOrder: count,
    },
  });
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function deleteProductImageAction(formData: FormData) {
  await requireAdmin();
  const imageId = String(formData.get("imageId") || "");
  const productId = String(formData.get("productId") || "");
  if (!imageId) return;
  await deleteProductImage(imageId);
  revalidatePath(`/admin/produtos/${productId}`);
}

export async function promoteUserToAdminAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.user.update({
    where: { id },
    data: { role: Role.ADMIN },
  });
  revalidatePath("/admin/clientes");
}
