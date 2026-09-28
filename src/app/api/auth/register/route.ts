import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createResetToken } from "@/lib/auth/reset-token";
import { registerSchema } from "@/lib/validations";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site-url";

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

  const verify = isMailConfigured() ? createResetToken() : null;
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      emailVerifyHash: verify?.hash,
      emailVerifyExpires: verify ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    },
  });

  if (verify) {
    const link = `${getSiteUrl().replace(/\/$/, "")}/api/auth/verify-email?token=${verify.token}`;
    try {
      await sendMail(
        email,
        "Confirme seu e-mail · Vesta Moda",
        `<p>Olá, ${parsed.data.name.replace(/</g, "")}.</p>
         <p><a href="${link}">Confirme seu e-mail</a> para entrar na conta. O link vale 24 horas.</p>`,
      );
    } catch (error) {
      console.error("[vesta] falha ao enviar confirmação:", error instanceof Error ? error.message : error);
      await prisma.user.delete({ where: { email } });
      return NextResponse.json(
        { message: "Não foi possível criar a conta agora. Tente de novo." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    needsVerification: Boolean(verify),
    message: verify
      ? "Enviamos um link para confirmar o e-mail. Depois disso você já pode entrar."
      : undefined,
  });
}
