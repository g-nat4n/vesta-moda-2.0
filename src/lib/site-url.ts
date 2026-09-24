/**
 * URL pública do site. Trata string vazia (comum na Vercel) como ausente.
 */
export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    try {
      return new URL(trimmed).origin;
    } catch {
      // tenta o próximo
    }
  }

  return "http://localhost:3000";
}
