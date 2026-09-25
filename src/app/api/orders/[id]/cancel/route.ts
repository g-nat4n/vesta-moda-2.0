import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  cancelOrderByCustomer,
  mercadoPagoErrorMessage,
} from "@/services/payment.service";
import { getOrderById } from "@/services/order.service";
import { canAccessOrder, readOrderAccessCookie } from "@/lib/order-access";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    await assertRateLimit({ key: "order-cancel", ip: clientIp(request), max: 10 });
    const { id } = await params;
    const session = await auth();
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
    }

    // Cancelamento: sessão do dono/admin OU cookie HttpOnly do checkout.
    // Token da URL/e-mail sozinho NÃO cancela (evita griefing com link vazado).
    const access = await readOrderAccessCookie(id);

    if (!canAccessOrder(order, session, access)) {
      return NextResponse.json(
        {
          message:
            "Para cancelar, use o mesmo navegador da compra ou entre na conta que fez o pedido.",
        },
        { status: 403 },
      );
    }

    const result = await cancelOrderByCustomer(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { message: mercadoPagoErrorMessage(error) },
      { status: 400 },
    );
  }
}
