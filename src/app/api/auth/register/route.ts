import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validations";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await assertRateLimit({ key: "register", ip: clientIp(request), max: 5 });
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
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (exists) {
    // Mesma mensagem genérica para não facilitar enumeração agressiva.
    return NextResponse.json(
      { message: "Não foi possível criar a conta com estes dados." },
      { status: 400 },
    );
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  return NextResponse.json({ ok: true });
}
