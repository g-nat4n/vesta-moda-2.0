import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { contactSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/auth/ip";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await assertRateLimit({ key: "contact", ip: clientIp(request), max: 5 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    throw error;
  }

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  await prisma.$executeRaw`
    INSERT INTO "ContactMessage" (id, name, email, whatsapp, message, "createdAt")
    VALUES (
      ${randomUUID()},
      ${parsed.data.name.trim()},
      ${parsed.data.email.toLowerCase()},
      ${parsed.data.whatsapp?.trim() || null},
      ${parsed.data.message.trim()},
      NOW()
    )
  `;

  return NextResponse.json({ ok: true });
}
