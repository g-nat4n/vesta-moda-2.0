import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;

export class LoginLockedError extends Error {
  code = "locked" as const;
  constructor() {
    super("Muitas tentativas. Aguarde 15 minutos e tente de novo.");
  }
}

export async function assertLoginAllowed(email: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });

  const failures = await prisma.loginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ email }, { ip }],
    },
  });

  if (failures >= MAX_FAILURES) {
    throw new LoginLockedError();
  }
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  await prisma.loginAttempt.create({
    data: { email, ip, success },
  });
  if (success) {
    await prisma.loginAttempt.deleteMany({
      where: { email, success: false },
    });
  }
}

export async function remainingLockMs(email: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const oldest = await prisma.loginAttempt.findFirst({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ email }, { ip }],
    },
    orderBy: { createdAt: "asc" },
  });
  if (!oldest) return 0;
  return Math.max(0, WINDOW_MS - (Date.now() - oldest.createdAt.getTime()));
}
