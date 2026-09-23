import { AdminShell } from "@/components/admin/AdminShell";
import { DbUnavailableBanner } from "@/components/admin/DbUnavailableBanner";
import { prisma } from "@/lib/prisma";
import { promoteUserToAdminAction } from "@/app/admin/actions";
import { createMetadata } from "@/lib/seo";
import { userPublicSelect } from "@/lib/auth/safe-user";

export const metadata = createMetadata({ title: "Clientes", path: "/admin/clientes", noIndex: true });

type CustomerRow = {
  id: string;
  name: string | null;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  _count: { orders: number };
};

export default async function AdminCustomersPage() {
  let customers: CustomerRow[] = [];
  let dbDown = false;

  try {
    customers = (await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        ...userPublicSelect,
        _count: { select: { orders: true } },
      },
    })) as CustomerRow[];
  } catch {
    dbDown = true;
  }

  return (
    <AdminShell>
      <p className="eyebrow">Pessoas</p>
      <h1 className="display mt-2 text-4xl">Clientes</h1>
      {dbDown ? <DbUnavailableBanner /> : null}
      {!dbDown && customers.length === 0 ? (
        <p className="mt-10 text-sm text-taupe">Nenhum cliente cadastrado ainda.</p>
      ) : null}
      {customers.length > 0 ? (
        <ul className="mt-8 divide-y divide-line">
          {customers.map((customer) => (
            <li key={customer.id} className="flex items-center justify-between gap-4 py-4 text-sm">
              <div>
                <p>{customer.name}</p>
                <p className="text-taupe">
                  {customer.email} · {customer._count.orders} pedidos ·{" "}
                  {customer.role === "ADMIN" ? "Administrador" : "Cliente"}
                </p>
              </div>
              {customer.role === "CUSTOMER" ? (
                <form action={promoteUserToAdminAction}>
                  <input type="hidden" name="id" value={customer.id} />
                  <button type="submit" className="text-[10px] uppercase tracking-[0.14em] text-burgundy">
                    Tornar admin
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </AdminShell>
  );
}
