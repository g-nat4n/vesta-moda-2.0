import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { checkoutSchema } from "@/lib/validations";
import { createOrder, restoreOrderStock } from "@/services/order.service";
import { createPaymentPreference, mercadoPagoErrorMessage } from "@/services/payment.service";
import {
  appendOrderAccess,
  createOrderAccessToken,
  ORDER_ACCESS_TTL_COOKIE,
  orderAccessCookieName,
  orderAccessCookieOptions,
} from "@/lib/order-access";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await assertRateLimit({ key: "orders-create", ip: clientIp(request), max: 5 });
    const session = await auth();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const cart = Array.isArray(body.cart) ? body.cart : [];
    const order = await createOrder(parsed.data, cart, session?.user.id);
    const accessToken = createOrderAccessToken(order.id, ORDER_ACCESS_TTL_COOKIE);

    try {
      const payment = await createPaymentPreference(order.id);
      const checkoutUrl = appendOrderAccess(payment.checkoutUrl, order.id, accessToken);
      const response = NextResponse.json({
        orderId: order.id,
        number: order.number,
        checkoutUrl,
      });
      response.cookies.set(
        orderAccessCookieName(order.id),
        accessToken,
        orderAccessCookieOptions(ORDER_ACCESS_TTL_COOKIE),
      );
      return response;
    } catch (error) {
      await restoreOrderStock(order.id, PaymentStatus.REJECTED);
      return NextResponse.json({ message: mercadoPagoErrorMessage(error) }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "Erro ao criar pedido";
    return NextResponse.json({ message }, { status: 400 });
  }
}
