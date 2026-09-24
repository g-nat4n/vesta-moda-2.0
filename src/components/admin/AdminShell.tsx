import Link from "next/link";
import { signOut } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory">
      {/* z-50: fica acima de qualquer overlay do menu mobile */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 border-r border-line bg-burgundy py-6 text-ivory md:flex md:flex-col">
        <Link href="/" className="display px-6 text-2xl tracking-[0.16em]">
          VESTA
        </Link>
        <p className="mt-1 px-6 text-[10px] uppercase tracking-[0.24em] text-gold">Atelier</p>
        <AdminNav />
        <div className="mt-auto space-y-3 px-6 pt-8">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center border border-gold bg-transparent px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gold transition hover:bg-gold hover:text-burgundy"
          >
            Voltar para a loja
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full py-2 text-center text-[11px] uppercase tracking-[0.16em] text-ivory/70 transition hover:text-gold"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>
      <div className="relative md:pl-60">
        <AdminMobileHeader />
        <div className="p-6 md:p-10">{children}</div>
      </div>
    </div>
  );
}
