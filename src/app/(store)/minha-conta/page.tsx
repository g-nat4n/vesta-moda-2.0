import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { StoreShell } from "@/components/layout/StoreShell";
import { AccountBagCards } from "@/components/account/AccountBagCards";
import { AccountOrderCards } from "@/components/account/AccountOrderCards";
import { listOrdersByUser } from "@/services/order.service";
import { Button } from "@/components/ui/Button";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Minha conta",
  path: "/minha-conta",
  noIndex: true,
});

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let orders: Awaited<ReturnType<typeof listOrdersByUser>> = [];
  let ordersUnavailable = false;
  try {
    orders = await listOrdersByUser(session.user.id);
  } catch {
    orders = [];
    ordersUnavailable = true;
  }

  return (
    <StoreShell>
      <section className="container-main py-16">
        <p className="eyebrow">Área do cliente</p>
        <h1 className="display mt-2 text-4xl">Olá, {session.user.name?.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-taupe">{session.user.email}</p>
        {session.user.role === "ADMIN" ? (
          <Button href="/admin" variant="ghost" className="mt-6">
            Painel administrativo
          </Button>
        ) : null}

        <h2 className="display mt-12 text-2xl">Na sacola</h2>
        <p className="mt-2 text-sm text-taupe">Peças que você ainda não finalizou.</p>
        <AccountBagCards />

        <h2 className="display mt-14 text-2xl">Meus pedidos</h2>
        <p className="mt-2 text-sm text-taupe">
          Acompanhe pedidos em andamento, finalizados e cancelados.
        </p>
        {ordersUnavailable ? (
          <p className="mt-4 text-sm text-taupe">
            Não foi possível carregar os pedidos agora. Tente de novo em instantes.
          </p>
        ) : (
          <AccountOrderCards orders={orders} />
        )}

        <form
          className="mt-12"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center border border-wine/30 bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-wine transition hover:border-wine hover:bg-wine hover:text-white"
          >
            Sair
          </button>
        </form>
      </section>
    </StoreShell>
  );
}
