import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type CouponClient = Prisma.TransactionClient | typeof prisma;

function discountFor(coupon: { percentOff: number | null; amountCents: number | null }, subtotalCents: number) {
  const discountCents = coupon.percentOff
    ? Math.round(subtotalCents * (coupon.percentOff / 100))
    : coupon.amountCents ?? 0;
  return Math.min(Math.max(discountCents, 0), subtotalCents);
}

async function loadCoupon(db: CouponClient, code: string | undefined, subtotalCents: number) {
  if (!code?.trim()) {
    return { discountCents: 0, couponId: null as string | null, code: null as string | null, coupon: null };
  }

  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.active) {
    throw new Error("Cupom inválido.");
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error("Este cupom expirou.");
  }
  if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents) {
    throw new Error("Este cupom não atinge o valor mínimo da compra.");
  }
  if (coupon.usedCount >= coupon.maxUses) {
    throw new Error("Este cupom já atingiu o limite de usos.");
  }

  return {
    discountCents: discountFor(coupon, subtotalCents),
    couponId: coupon.id,
    code: coupon.code,
    coupon,
  };
}

/** Prévia no checkout. Não consome o cupom. */
export async function previewCoupon(code: string, subtotalCents: number) {
  const result = await loadCoupon(prisma, code, subtotalCents);
  return {
    discountCents: result.discountCents,
    couponId: result.couponId,
    code: result.code,
  };
}

/**
 * Consome 1 uso dentro da transação do pedido.
 * Dois checkouts no último uso: só um `updateMany` passa.
 */
export async function redeemCoupon(
  tx: Prisma.TransactionClient,
  code: string | undefined,
  subtotalCents: number,
) {
  const result = await loadCoupon(tx, code, subtotalCents);
  if (!result.coupon) {
    return { discountCents: 0, couponId: null as string | null, code: null as string | null };
  }

  const taken = await tx.coupon.updateMany({
    where: {
      id: result.coupon.id,
      active: true,
      usedCount: { lt: result.coupon.maxUses },
    },
    data: { usedCount: { increment: 1 } },
  });
  if (taken.count !== 1) {
    throw new Error("Este cupom já atingiu o limite de usos.");
  }

  return {
    discountCents: result.discountCents,
    couponId: result.couponId,
    code: result.code,
  };
}
