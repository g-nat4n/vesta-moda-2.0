import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import {
  orderAccessCookieName,
  orderAccessCookieOptions,
  orderAccessTokenMaxAge,
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

  if (!access || !verifyOrderAccessToken(id, access)) {
    return NextResponse.redirect(new URL(`/pedido/${id}`, site));
  }

  const destination = new URL(`/pedido/${id}`, site);
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "access") continue;
    destination.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(
    orderAccessCookieName(id),
    access,
    orderAccessCookieOptions(orderAccessTokenMaxAge(access)),
  );
  return response;
}
