import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { handleMercadoPagoNotification } from "@/services/payment.service";

function verifyMercadoPagoSignature(request: Request, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Fail-closed: sem secret, ninguém processa notificações (inclui preview/staging).
    console.error("[vesta] MERCADOPAGO_WEBHOOK_SECRET ausente — webhook rejeitado.");
    return false;
  }

  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [k, v] = part.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as { ts?: string; v1?: string };

  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    const a = Buffer.from(parts.v1, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    action?: string;
    data?: { id?: string };
  };

  const paymentId = body.data?.id;
  const isPayment = body.type === "payment" || body.action?.includes("payment");

  if (paymentId && isPayment) {
    if (!verifyMercadoPagoSignature(request, String(paymentId))) {
      return NextResponse.json({ message: "Assinatura inválida." }, { status: 401 });
    }
    await handleMercadoPagoNotification(String(paymentId));
  }

  return NextResponse.json({ received: true });
}
