import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function contentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https://sdk.mercadopago.com",
      "https://http2.mlstatic.com",
      "https://www.mercadopago.com",
      "https://www.mercadopago.com.br",
      isDev ? "'unsafe-eval'" : "",
    ]
      .filter(Boolean)
      .join(" "),
    "style-src 'self' 'unsafe-inline' https://http2.mlstatic.com https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://http2.mlstatic.com",
    "connect-src 'self' https://api.mercadopago.com https://www.mercadopago.com https://www.mercadopago.com.br https://http2.mlstatic.com",
    "frame-src 'self' https://www.mercadopago.com https://www.mercadopago.com.br https://http2.mlstatic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.mercadopago.com https://www.mercadopago.com.br",
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAccount = pathname === "/minha-conta" || pathname.startsWith("/minha-conta/");
  // Middleware roda no Edge Runtime: não depender de Buffer/Node.
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const finish = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  // Nunca permitir mock de pagamento fora de localhost.
  if (pathname.startsWith("/api/payments/local-approve")) {
    const host = req.nextUrl.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return finish(NextResponse.json({ message: "Não autorizado." }, { status: 403 }));
    }
  }

  if (isAdminApi && (!req.auth || req.auth.user.role !== "ADMIN")) {
    return finish(NextResponse.json({ message: "Não autorizado" }, { status: 401 }));
  }

  if ((isAdminPage || isAccount) && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return finish(NextResponse.redirect(url));
  }

  if (isAdminPage && req.auth?.user.role !== "ADMIN") {
    return finish(NextResponse.redirect(new URL("/", req.nextUrl.origin)));
  }

  return finish(NextResponse.next({ request: { headers: requestHeaders } }));
});

export const config = {
  runtime: "nodejs",
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
