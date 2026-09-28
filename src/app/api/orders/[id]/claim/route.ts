import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import {
  createOrderAccessToken,
  ORDER_ACCESS_TTL_COOKIE,
  orderAccessCookieName,
  orderAccessCookieOptions,
  verifyOrderAccessToken,
} from "@/lib/order-access";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

type Params = Promise<{ id: string }>;

/**
 * Troca ?access= da URL por cookie HttpOnly e redireciona sem o token na query.
 * Usado pelos links de e-mail para reduzir vazamento via Referer/histórico.
 */
export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const url = new URL(request.url);
  const access = url.searchParams.get("access");
  const site = getSiteUrl().replace(/\/$/, "");

  try {
    await assertRateLimit({ key: "order-claim", ip: clientIp(request), max: 30 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    throw error;
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { accessVersion: true },
  });
  if (!order || !access || !verifyOrderAccessToken(id, access, order.accessVersion)) {
    return NextResponse.redirect(new URL(`/pedido/${id}`, site));
  }

  // O link do e-mail vale uma vez. O cookie novo usa a versão seguinte.
  const burned = await prisma.order.updateMany({
    where: { id, accessVersion: order.accessVersion },
    data: { accessVersion: { increment: 1 } },
  });
  if (burned.count !== 1) {
    return NextResponse.redirect(new URL(`/pedido/${id}`, site));
  }

  const destination = new URL(`/pedido/${id}`, site);
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "access") continue;
    destination.searchParams.set(key, value);
  }

  const cookieToken = createOrderAccessToken(id, ORDER_ACCESS_TTL_COOKIE, order.accessVersion + 1);
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    orderAccessCookieName(id),
    cookieToken,
    orderAccessCookieOptions(ORDER_ACCESS_TTL_COOKIE),
  );
  return response;
}
