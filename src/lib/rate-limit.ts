import { prisma } from "@/lib/prisma";

export class RateLimitError extends Error {
  status = 429 as const;
  constructor(message = "Muitas tentativas. Aguarde um minuto e tente de novo.") {
    super(message);
  }
}

/** Rate limit simples reutilizando LoginAttempt (sem migration). */
export async function assertRateLimit(input: {
  key: string;
  ip: string;
  max: number;
  windowMs?: number;
}) {
  const windowMs = input.windowMs ?? 60_000;
  const since = new Date(Date.now() - windowMs);
  const email = `@rate/${input.key}`;

  const count = await prisma.loginAttempt.count({
    where: {
      email,
      ip: input.ip,
      createdAt: { gte: since },
    },
  });

  if (count >= input.max) {
    throw new RateLimitError();
  }

  await prisma.loginAttempt.create({
    data: { email, ip: input.ip, success: true },
  });
}
