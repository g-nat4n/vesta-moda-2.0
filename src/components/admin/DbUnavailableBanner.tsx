export function DbUnavailableBanner() {
  return (
    <p className="mt-6 border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-wine">
      Banco de dados indisponível (`localhost:55432`). Abra o Docker Desktop e rode{" "}
      <code className="font-mono text-xs">docker compose up -d</code>, depois{" "}
      <code className="font-mono text-xs">npx prisma db push</code> e{" "}
      <code className="font-mono text-xs">npx prisma db seed</code>.
    </p>
  );
}
