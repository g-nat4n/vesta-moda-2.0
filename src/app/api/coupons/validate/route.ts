import { NextResponse } from "next/server";
import { previewCoupon } from "@/services/coupon.service";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await assertRateLimit({ key: "coupon", ip: clientIp(request), max: 20 });
    const { code, subtotalCents } = (await request.json()) as {
      code?: string;
      subtotalCents?: number;
    };
    const result = await previewCoupon(code ?? "", Number(subtotalCents ?? 0));
    return NextResponse.json({
      discountCents: result.discountCents,
      code: result.code,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "Cupom inválido";
    return NextResponse.json({ message }, { status: 400 });
  }
}
