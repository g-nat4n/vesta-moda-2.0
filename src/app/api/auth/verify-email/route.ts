import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/auth/reset-token";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const site = getSiteUrl().replace(/\/$/, "");
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";

  try {
    await assertRateLimit({ key: "verify-email", ip: clientIp(request), max: 20 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.redirect(`${site}/login?verified=invalid`);
    }
    throw error;
  }

  if (token.length < 20) {
    return NextResponse.redirect(`${site}/login?verified=invalid`);
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyHash: hashResetToken(token),
      emailVerifyExpires: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.redirect(`${site}/login?verified=invalid`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyHash: null,
      emailVerifyExpires: null,
    },
  });

  return NextResponse.redirect(`${site}/login?verified=ok`);
}
