export function clientIp(request?: Request | null) {
  // x-real-ip é o IP que a plataforma viu. O primeiro X-Forwarded-For pode ser inventado pelo cliente.
  const real = request?.headers.get("x-real-ip")?.trim();
  if (real) return real;

  const forwarded = request?.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    const last = parts.at(-1);
    if (last) return last;
  }

  return "0.0.0.0";
}
