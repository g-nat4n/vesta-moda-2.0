import { NextResponse } from "next/server";
import { markOrderPaid } from "@/services/order.service";
import { getSiteUrl } from "@/lib/site-url";
import { isMercadoPagoSandbox } from "@/services/payment.service";

/**
 * Aprova um pedido só em localhost + sandbox + MERCADOPAGO_LOCAL_MOCK=true.
 * Usado para testar o fluxo da loja sem depender do Checkout Pro / conta TESTUSER.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  const appUrl = getSiteUrl();
  const isLocal = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const allowed =
    isLocal &&
    isMercadoPagoSandbox() &&
    process.env.MERCADOPAGO_LOCAL_MOCK === "true";

  if (!allowed || !orderId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
  }

  await markOrderPaid(orderId, `local-mock-${Date.now()}`, {
    mock: true,
    source: "local-approve",
  });

  return NextResponse.redirect(
    new URL(`/pedido/${orderId}?result=success`, appUrl),
  );
}
