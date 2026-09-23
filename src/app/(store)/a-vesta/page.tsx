import { StoreShell } from "@/components/layout/StoreShell";
import { Manifesto } from "@/components/home/Manifesto";
import { EditorialLook } from "@/components/home/EditorialLook";
import { Button } from "@/components/ui/Button";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/brand";

export const metadata = createMetadata({
  title: "A Vesta",
  description: BRAND.manifesto.description,
  path: "/a-vesta",
});

export default function AboutPage() {
  return (
    <StoreShell>
      <section className="border-b border-line bg-ivory px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-5xl tracking-[0.2em] text-ink">{BRAND.wordmark}</p>
          <p className="mt-4 text-sm text-taupe">{BRAND.phrase}</p>
        </div>
      </section>
      <Manifesto />
      <EditorialLook />
      <section className="bg-ivory px-6 py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl justify-center">
          <Button href="/produtos">{BRAND.hero.primaryCta}</Button>
        </div>
      </section>
    </StoreShell>
  );
}
