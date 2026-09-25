import { NextResponse } from "next/server";
import { quoteShipping } from "@/services/shipping.service";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await assertRateLimit({ key: "shipping-quote", ip: clientIp(request), max: 30 });
    const { zip } = (await request.json()) as { zip?: string };
    const quotes = await quoteShipping(zip ?? "");
    return NextResponse.json({ quotes });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "Erro ao calcular frete";
    return NextResponse.json({ message }, { status: 400 });
  }
}
