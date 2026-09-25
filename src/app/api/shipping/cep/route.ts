import { NextResponse } from "next/server";
import { lookupCep } from "@/services/shipping.service";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await assertRateLimit({ key: "shipping-cep", ip: clientIp(request), max: 30 });
    const { zip } = (await request.json()) as { zip?: string };
    const address = await lookupCep(zip ?? "");
    return NextResponse.json(address);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "CEP inválido";
    return NextResponse.json({ message }, { status: 400 });
  }
}
