import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { ProductFormInput } from "@/lib/validations";

const catalogInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  category: true,
  look: {
    include: {
      products: {
        include: { images: { orderBy: { sortOrder: "asc" as const } } },
        where: { status: ProductStatus.AVAILABLE },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type CatalogFilters = {
  q?: string;
  category?: string;
  size?: string;
  brand?: string;
  condition?: string;
  availability?: "available" | "sold" | "all";
  min?: number;
  max?: number;
  sort?: "recent" | "price-asc" | "price-desc" | "name";
};

export async function listPublicProducts(filters: CatalogFilters = {}) {
  const where: Prisma.ProductWhereInput = {};

  if (filters.availability === "sold") {
    where.status = ProductStatus.SOLD;
  } else if (filters.availability === "all") {
    where.status = { in: [ProductStatus.AVAILABLE, ProductStatus.SOLD, ProductStatus.RESERVED] };
  } else {
    where.status = ProductStatus.AVAILABLE;
    where.stock = { gt: 0 };
  }

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { brand: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.category) where.category = { slug: filters.category };
  if (filters.size) where.size = { equals: filters.size, mode: "insensitive" };
  if (filters.brand) where.brand = { equals: filters.brand, mode: "insensitive" };
  if (filters.condition) where.condition = filters.condition as Prisma.EnumProductConditionFilter;
  if (filters.min || filters.max) {
    where.priceCents = {
      gte: filters.min ? Math.round(filters.min * 100) : undefined,
      lte: filters.max ? Math.round(filters.max * 100) : undefined,
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price-asc"
      ? { priceCents: "asc" }
      : filters.sort === "price-desc"
        ? { priceCents: "desc" }
        : filters.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  return prisma.product.findMany({
    where,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: true,
    },
    orderBy,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: catalogInclude,
  });
}

export async function getProductsBySlugs(slugs: string[]) {
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    include: catalogInclude,
  });
  return slugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
}

export async function getRelatedProducts(product: {
  id: string;
  categoryId: string;
  lookId?: string | null;
  color: string;
  brand: string;
  priceCents: number;
}) {
  const minPrice = Math.round(product.priceCents * 0.6);
  const maxPrice = Math.round(product.priceCents * 1.4);
  const color = product.color.toLowerCase();
  const brand = product.brand.toLowerCase();

  const similar: Prisma.ProductWhereInput[] = [
    { categoryId: product.categoryId },
    { brand: { equals: product.brand, mode: "insensitive" } },
    { color: { equals: product.color, mode: "insensitive" } },
    { priceCents: { gte: minPrice, lte: maxPrice } },
  ];
  if (product.lookId) similar.push({ lookId: product.lookId });

  const candidates = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      status: ProductStatus.AVAILABLE,
      stock: { gt: 0 },
      OR: similar,
    },
    include: catalogInclude,
    take: 24,
  });

  return candidates
    .map((item) => {
      let score = 0;
      if (item.categoryId === product.categoryId) score += 6;
      if (product.lookId && item.lookId === product.lookId) score += 3;
      if (item.brand.toLowerCase() === brand) score += 2;
      if (item.color.toLowerCase() === color) score += 2;
      if (item.priceCents >= minPrice && item.priceCents <= maxPrice) score += 2;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.item);
}

export async function getCatalogFacets() {
  const [brands, sizes, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: ProductStatus.AVAILABLE },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    }),
    prisma.product.findMany({
      where: { status: ProductStatus.AVAILABLE },
      distinct: ["size"],
      select: { size: true },
      orderBy: { size: "asc" },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    brands: brands.map((item) => item.brand),
    sizes: sizes.map((item) => item.size),
    categories,
  };
}

export async function listAdminProducts() {
  return prisma.product.findMany({
    include: { images: true, category: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listFeaturedProducts(limit = 24) {
  return prisma.product.findMany({
    where: {
      featured: true,
      status: ProductStatus.AVAILABLE,
      stock: { gt: 0 },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function setProductFeatured(id: string, featured: boolean) {
  return prisma.product.update({
    where: { id },
    data: { featured },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: catalogInclude,
  });
}

export async function upsertProduct(input: ProductFormInput, id?: string) {
  const slugBase = slugify(input.name);
  const slug = await uniqueProductSlug(slugBase, id);

  const data = {
    name: input.name,
    slug,
    description: input.description,
    story: input.story,
    brand: input.brand,
    size: input.size,
    color: input.color,
    condition: input.condition,
    priceCents: input.priceCents,
    compareAtCents: input.compareAtCents ?? null,
    stock: input.stock,
    status: input.status,
    featured: input.featured ?? false,
    uniquePiece: input.uniquePiece ?? true,
    material: input.material,
    categoryId: input.categoryId,
    lookId: input.lookId || null,
    measurements: input.measurements ?? Prisma.JsonNull,
  };

  if (id) {
    const product = await prisma.product.update({ where: { id }, data });
    if (input.imageUrl) {
      await prisma.productImage.deleteMany({ where: { productId: id, kind: "MAIN" } });
      await prisma.productImage.create({
        data: {
          productId: id,
          url: input.imageUrl,
          alt: input.name,
          kind: "MAIN",
          sortOrder: 0,
        },
      });
    }
    return product;
  }

  return prisma.product.create({
    data: {
      ...data,
      images: input.imageUrl
        ? {
            create: {
              url: input.imageUrl,
              alt: input.name,
              kind: "MAIN",
              sortOrder: 0,
            },
          }
        : undefined,
    },
  });
}

async function uniqueProductSlug(base: string, ignoreId?: string) {
  let slug = base;
  let i = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${i}`;
    i += 1;
  }
}

export async function addProductImage(productId: string, url: string, alt: string, publicId?: string) {
  const count = await prisma.productImage.count({ where: { productId } });
  return prisma.productImage.create({
    data: {
      productId,
      url,
      alt,
      publicId,
      kind: count === 0 ? "MAIN" : "DETAIL",
      sortOrder: count,
    },
  });
}

export async function deleteProductImage(id: string) {
  return prisma.productImage.delete({ where: { id } });
}

export async function deleteProduct(id: string) {
  const inOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (inOrders > 0) {
    throw new Error("Esta peça já entrou em um pedido. Arquive em vez de excluir.");
  }
  return prisma.product.delete({ where: { id } });
}
