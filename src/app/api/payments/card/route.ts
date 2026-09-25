import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  createCardPayment,
  mercadoPagoErrorMessage,
} from "@/services/payment.service";
import { getOrderById } from "@/services/order.service";
import { canAccessOrder, readOrderAccessToken } from "@/lib/order-access";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

const bodySchema = z.object({
  orderId: z.string().min(1),
  token: z.string().min(1),
  paymentMethodId: z.string().min(1),
  installments: z.coerce.number().int().min(1).max(24).default(1),
  issuerId: z.union([z.string(), z.number()]).optional().nullable(),
  payerEmail: z.string().email().optional().nullable(),
  payerIdentification: z
    .object({
      type: z.string().optional().nullable(),
      number: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  access: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    await assertRateLimit({
      key: "payments-card",
      ip: clientIp(request),
      max: 8,
    });

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados do cartão incompletos." },
        { status: 400 },
      );
    }

    const session = await auth();
    const access =
      parsed.data.access ||
      (await readOrderAccessToken(parsed.data.orderId));
    const order = await getOrderById(parsed.data.orderId);
    if (!order) {
      return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
    }
    if (!canAccessOrder(order, session, access)) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const result = await createCardPayment({
      orderId: parsed.data.orderId,
      token: parsed.data.token,
      paymentMethodId: parsed.data.paymentMethodId,
      installments: parsed.data.installments,
      issuerId: parsed.data.issuerId,
      payerEmail: parsed.data.payerEmail,
      payerIdentification: parsed.data.payerIdentification,
    });

    if (result.status === "rejected" || result.status === "cancelled") {
      return NextResponse.json(
        {
          ...result,
          message:
            result.statusDetail === "cc_rejected_other_reason"
              ? "Cartão recusado. No teste, use nome APRO e CPF 12345678909."
              : `Pagamento recusado (${result.statusDetail ?? "sem detalhe"}).`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    console.error("[payments/card]", error);
    return NextResponse.json(
      { message: mercadoPagoErrorMessage(error) },
      { status: 400 },
    );
  }
}
