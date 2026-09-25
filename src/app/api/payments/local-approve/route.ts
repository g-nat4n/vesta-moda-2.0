import { NextResponse } from "next/server";
import { markOrderPaid } from "@/services/order.service";
import { getSiteUrl } from "@/lib/site-url";
import { isMercadoPagoSandbox } from "@/services/payment.service";
import {
  appendOrderAccess,
  createOrderAccessToken,
  ORDER_ACCESS_TTL_COOKIE,
  orderAccessCookieName,
  orderAccessCookieOptions,
} from "@/lib/order-access";

/**
 * Aprova um pedido só em localhost + sandbox + MERCADOPAGO_LOCAL_MOCK=true.
 * Usado para testar o fluxo da loja sem depender do Checkout Pro / conta TESTUSER.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  const appUrl = getSiteUrl();
  const requestHost = url.hostname;
  const isLocalRequest =
    requestHost === "localhost" || requestHost === "127.0.0.1";
  const isLocalApp =
    appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const allowed =
    isLocalRequest &&
    isLocalApp &&
    isMercadoPagoSandbox() &&
    process.env.MERCADOPAGO_LOCAL_MOCK === "true";

  if (!allowed || !orderId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
  }

  await markOrderPaid(orderId, `local-mock-${Date.now()}`, {
    mock: true,
    source: "local-approve",
  });

  const access = createOrderAccessToken(orderId, ORDER_ACCESS_TTL_COOKIE);
  const destination = new URL(
    appendOrderAccess(`/pedido/${orderId}?result=success`, orderId, access),
    appUrl,
  );
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    orderAccessCookieName(orderId),
    access,
    { ...orderAccessCookieOptions(ORDER_ACCESS_TTL_COOKIE), secure: false },
  );
  return response;
}
