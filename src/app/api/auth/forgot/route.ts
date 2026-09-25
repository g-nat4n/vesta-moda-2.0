import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { clientIp } from "@/lib/auth/ip";
import { assertLoginAllowed, LoginLockedError, recordLoginAttempt } from "@/lib/auth/lockout";
import { createResetToken } from "@/lib/auth/reset-token";
import { isMailConfigured, sendMail } from "@/lib/mail";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function okResponse() {
  return NextResponse.json({
    ok: true,
    message: "Se este e-mail estiver cadastrado, enviamos o link de redefinição.",
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const ip = clientIp(request);

  try {
    await assertLoginAllowed(email, ip);
  } catch (error) {
    if (error instanceof LoginLockedError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    throw error;
  }

  const since = new Date(Date.now() - 60_000);
  const recent = await prisma.loginAttempt.count({
    where: { email, createdAt: { gte: since } },
  });
  if (recent >= 3) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde 1 minuto e tente de novo." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  // Sempre a mesma resposta 200 — evita enumerar e-mails e estado do SMTP.
  if (!user) {
    await recordLoginAttempt(email, ip, false);
    return okResponse();
  }

  if (!isMailConfigured()) {
    console.error("[vesta] forgot-password: SMTP não configurado.");
    await recordLoginAttempt(email, ip, false);
    return okResponse();
  }

  const { token, hash } = createResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetHash: hash,
      passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/redefinir-senha?token=${token}`;

  try {
    await sendMail(
      user.email,
      "Redefinir senha · Vesta Moda",
      `<p>Olá, ${escapeHtml(user.name)}.</p>
       <p>Recebemos um pedido para redefinir sua senha na Vesta Moda.</p>
       <p><a href="${escapeHtml(resetUrl)}">Clique aqui para criar uma nova senha</a>. Este link vale por 30 minutos.</p>
       <p>Se você não pediu isso, ignore este e-mail.</p>`,
    );
  } catch (error) {
    console.error("[vesta] falha ao enviar e-mail:", error instanceof Error ? error.message : error);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetHash: null, passwordResetExpires: null },
    });
    await recordLoginAttempt(email, ip, false);
    return okResponse();
  }

  await prisma.loginAttempt.create({ data: { email, ip, success: true } });
  return okResponse();
}
