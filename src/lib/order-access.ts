import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Link do e-mail: 1 hora. O claim troca por cookie e invalida este token. */
export const ORDER_ACCESS_TTL_EMAIL = 60 * 60;
/** Cookie HttpOnly do checkout. */
export const ORDER_ACCESS_TTL_COOKIE = 60 * 60 * 24;

function secret() {
  // Nunca usa token do MP como fallback (vazamento do token de pagamento
  // não deve forjar cookies de acesso a pedidos).
  const value = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (!value) {
    throw new Error("AUTH_SECRET não configurado para proteger pedidos.");
  }
  return value;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Token assinado para convidado acessar um pedido (ver / pagar). */
export function createOrderAccessToken(
  orderId: string,
  ttlSeconds = ORDER_ACCESS_TTL_COOKIE,
  accessVersion = 0,
) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${orderId}.${exp}.${accessVersion}`;
  return `${exp}.${accessVersion}.${sign(payload)}`;
}

export function verifyOrderAccessToken(
  orderId: string,
  token?: string | null,
  accessVersion = 0,
) {
  if (!token) return false;
  const [expRaw, versionRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  const version = Number(versionRaw);
  if (!expRaw || versionRaw == null || !sig || !Number.isFinite(exp) || !Number.isFinite(version)) {
    return false;
  }
  if (version !== accessVersion) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;

  const expected = sign(`${orderId}.${exp}.${version}`);
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Segundos restantes até o exp do token (para maxAge do cookie). */
export function orderAccessTokenMaxAge(token: string) {
  const [expRaw] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return ORDER_ACCESS_TTL_EMAIL;
  return Math.max(60, exp - Math.floor(Date.now() / 1000));
}

export function orderAccessCookieName(orderId: string) {
  return `vesta_oa_${orderId}`;
}

export function orderAccessCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

async function currentAccessVersion(orderId: string) {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    select: { accessVersion: true },
  });
  return row?.accessVersion ?? 0;
}

export async function readOrderAccessToken(orderId: string, queryToken?: string | null) {
  const version = await currentAccessVersion(orderId);
  if (queryToken && verifyOrderAccessToken(orderId, queryToken, version)) return queryToken;
  const jar = await cookies();
  const fromCookie = jar.get(orderAccessCookieName(orderId))?.value;
  if (fromCookie && verifyOrderAccessToken(orderId, fromCookie, version)) return fromCookie;
  return null;
}

/** Só o cookie HttpOnly (não aceita token da URL/body). */
export async function readOrderAccessCookie(orderId: string) {
  const version = await currentAccessVersion(orderId);
  const jar = await cookies();
  const fromCookie = jar.get(orderAccessCookieName(orderId))?.value;
  if (fromCookie && verifyOrderAccessToken(orderId, fromCookie, version)) return fromCookie;
  return null;
}

export type OrderAccessSubject = {
  id: string;
  userId?: string | null;
  email: string;
  accessVersion?: number;
};

export type SessionLike = {
  user?: { id?: string; email?: string | null; role?: string } | null;
} | null;

export function canAccessOrder(
  order: OrderAccessSubject,
  session: SessionLike,
  accessToken?: string | null,
) {
  if (session?.user?.role === "ADMIN") return true;
  if (session?.user?.id && order.userId && session.user.id === order.userId) return true;
  // Não libera só por e-mail (conta criada com o mesmo e-mail do guest).
  // Guest usa token assinado; conta logada precisa ser a dona (userId).
  return verifyOrderAccessToken(order.id, accessToken, order.accessVersion ?? 0);
}

export function appendOrderAccess(url: string, orderId: string, token: string) {
  // Nunca acrescenta token em URL externa (ex.: Mercado Pago).
  if (!url.startsWith("/")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}access=${encodeURIComponent(token)}`;
}
