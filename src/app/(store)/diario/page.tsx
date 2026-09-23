import { StoreShell } from "@/components/layout/StoreShell";
import { JournalGrid } from "@/components/home/JournalGrid";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/brand";

export const metadata = createMetadata({
  title: "Diário Vesta",
  description: "Notas de curadoria, uso e estilo da Vesta Moda Pre-Owned.",
  path: "/diario",
});

export default function JournalPage() {
  const { journal } = BRAND;

  return (
    <StoreShell>
      <section className="w-full bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{journal.kicker}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold text-ink">{journal.title}</h1>
          <p className="mt-4 max-w-xl text-sm text-taupe">
            Notas de curadoria, uso e estilo — histórias em construção.
          </p>
          <JournalGrid expandedByDefault />
        </div>
      </section>
    </StoreShell>
  );
}
