import { BRAND } from "@/lib/brand";
import { Reveal } from "@/components/ui/Reveal";

export function Manifesto() {
  const { manifesto } = BRAND;

  return (
    <section id="vesta" className="w-full bg-ivory px-6 py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">{manifesto.kicker}</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              {manifesto.title}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-taupe">{manifesto.description}</p>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {manifesto.pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.08}>
              <article className="border-t border-line pt-6">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{pillar.n}</span>
                <h3 className="mt-4 font-serif text-2xl text-ink">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-taupe">{pillar.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
