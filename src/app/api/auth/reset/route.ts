import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { hashResetToken } from "@/lib/auth/reset-token";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await assertRateLimit({ key: "auth-reset", ip: clientIp(request), max: 10 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    throw error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetHash: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Este link é inválido ou já expirou." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      passwordResetHash: null,
      passwordResetExpires: null,
    },
  });

  return NextResponse.json({ ok: true });
}
