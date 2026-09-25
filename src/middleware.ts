import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAccount = pathname === "/minha-conta" || pathname.startsWith("/minha-conta/");

  // Nunca permitir mock de pagamento fora de localhost.
  if (pathname.startsWith("/api/payments/local-approve")) {
    const host = req.nextUrl.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }
  }

  if (isAdminApi && (!req.auth || req.auth.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  if ((isAdminPage || isAccount) && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminPage && req.auth?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/minha-conta",
    "/minha-conta/:path*",
    "/api/admin/:path*",
    "/api/payments/local-approve",
  ],
};
