import { OrderStatus, PaymentStatus, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validations";
import { quoteShipping } from "@/services/shipping.service";
import { applyCoupon } from "@/services/coupon.service";

type CartSnapshot = {
  productId: string;
  quantity: number;
  slug?: string;
};

export async function createOrder(input: CheckoutInput, cart: CartSnapshot[], userId?: string) {
  if (cart.length === 0) {
    throw new Error("Sua sacola está vazia.");
  }

  return prisma.$transaction(async (tx) => {
    const keys = [...new Set(cart.flatMap((item) => [item.productId, item.slug].filter(Boolean) as string[]))];

    const products = await tx.product.findMany({
      where: {
        OR: [{ id: { in: keys } }, { slug: { in: keys } }],
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    const resolveProduct = (item: CartSnapshot) =>
      products.find(
        (entry) =>
          entry.id === item.productId ||
          entry.slug === item.productId ||
          (item.slug ? entry.slug === item.slug || entry.id === item.slug : false),
      );

    const missing = cart.filter((item) => !resolveProduct(item));
    if (missing.length > 0) {
      throw new Error(
        "Uma das peças não está mais disponível. Remova da sacola e adicione de novo pela Curadoria.",
      );
    }

    const lines = cart.map((item) => {
      const product = resolveProduct(item)!;
      if (product.status !== ProductStatus.AVAILABLE || product.stock < item.quantity) {
        throw new Error(`${product.name} não está mais disponível.`);
      }
      if (product.uniquePiece && item.quantity > 1) {
        throw new Error(`${product.name} é peça única.`);
      }
      return { item, product };
    });

    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.product.priceCents * line.item.quantity,
      0,
    );

    const quotes = await quoteShipping(input.zip);
    const shipping = quotes.find((quote) => quote.id === input.shippingMethod);
    if (!shipping) {
      throw new Error("Opção de envio indisponível. Recalcule o frete.");
    }

    const coupon = await applyCoupon(input.couponCode, subtotalCents);
    const totalCents = Math.max(subtotalCents - coupon.discountCents + shipping.priceCents, 0);

    const order = await tx.order.create({
      data: {
        number: generateOrderNumber(),
        userId,
        email: input.email.toLowerCase(),
        customerName: input.customerName,
        cpf: input.cpf,
        phone: input.phone,
        zip: input.zip,
        street: input.street,
        numberAddress: input.numberAddress,
        complement: input.complement,
        district: input.district,
        city: input.city,
        state: input.state.toUpperCase(),
        status: OrderStatus.PENDING,
        subtotalCents,
        discountCents: coupon.discountCents,
        shippingCents: shipping.priceCents,
        totalCents,
        shippingMethod: shipping.id,
        shippingLabel: shipping.label,
        couponId: coupon.couponId,
        couponCode: coupon.code,
        items: {
          create: lines.map(({ item, product }) => ({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            size: product.size,
            quantity: item.quantity,
            priceCents: product.priceCents,
            imageUrl: product.images[0]?.url,
          })),
        },
        payment: {
          create: {
            amountCents: totalCents,
            status: PaymentStatus.PENDING,
          },
        },
      },
      include: { items: true, payment: true },
    });

    for (const { item, product } of lines) {
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { decrement: item.quantity },
          status:
            product.uniquePiece || product.stock - item.quantity <= 0
              ? ProductStatus.RESERVED
              : ProductStatus.AVAILABLE,
        },
      });
    }

    return order;
  });
}

export async function markOrderPaid(orderId: string, providerPaymentId?: string, rawPayload?: unknown) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });
    if (!order) throw new Error("Pedido não encontrado.");

    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
    });

    await tx.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.APPROVED,
        providerPaymentId,
        rawPayload: rawPayload as object | undefined,
      },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          status: ProductStatus.SOLD,
          stock: 0,
        },
      });
    }

    return order;
  });
}

export async function restoreOrderStock(orderId: string, paymentStatus: PaymentStatus) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status === OrderStatus.CANCELLED) return order;

    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
    await tx.payment.update({
      where: { orderId },
      data: { status: paymentStatus },
    });

    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status === ProductStatus.SOLD) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          status: ProductStatus.AVAILABLE,
        },
      });
    }

    return order;
  });
}

export async function listOrders(filters?: { status?: OrderStatus; q?: string }) {
  return prisma.order.findMany({
    where: {
      status: filters?.status,
      OR: filters?.q
        ? [
            { number: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { customerName: { contains: filters.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      items: true,
      payment: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payment: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function getOrderByNumber(number: string, email?: string) {
  return prisma.order.findFirst({
    where: { number, email: email?.toLowerCase() },
    include: { items: true, payment: true },
  });
}

export async function listOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({ where: { id }, data: { status } });
}
