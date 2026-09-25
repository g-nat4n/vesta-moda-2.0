import crypto from "node:crypto";
import { cookies } from "next/headers";

/** Links de e-mail: curtos para limitar vazamento via histórico/Referer. */
export const ORDER_ACCESS_TTL_EMAIL = 60 * 60 * 4; // 4h
/** Cookie HttpOnly do checkout: cobre retry de pagamento. */
export const ORDER_ACCESS_TTL_COOKIE = 60 * 60 * 24 * 7; // 7d

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
) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${orderId}.${exp}`;
  return `${exp}.${sign(payload)}`;
}

export function verifyOrderAccessToken(orderId: string, token?: string | null) {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  if (!expRaw || !sig || !Number.isFinite(exp)) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;

  const expected = sign(`${orderId}.${exp}`);
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

export async function readOrderAccessToken(orderId: string, queryToken?: string | null) {
  if (queryToken && verifyOrderAccessToken(orderId, queryToken)) return queryToken;
  const jar = await cookies();
  const fromCookie = jar.get(orderAccessCookieName(orderId))?.value;
  if (fromCookie && verifyOrderAccessToken(orderId, fromCookie)) return fromCookie;
  return null;
}

/** Só o cookie HttpOnly (não aceita token da URL/body). */
export async function readOrderAccessCookie(orderId: string) {
  const jar = await cookies();
  const fromCookie = jar.get(orderAccessCookieName(orderId))?.value;
  if (fromCookie && verifyOrderAccessToken(orderId, fromCookie)) return fromCookie;
  return null;
}

export type OrderAccessSubject = {
  id: string;
  userId?: string | null;
  email: string;
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
  return verifyOrderAccessToken(order.id, accessToken);
}

export function appendOrderAccess(url: string, orderId: string, token: string) {
  // Nunca acrescenta token em URL externa (ex.: Mercado Pago).
  if (!url.startsWith("/")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}access=${encodeURIComponent(token)}`;
}
