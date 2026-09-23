import { Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/brand";

/** Banner editorial "Escolha sentir" — substitui o card promocional. */
export function EditorialLook() {
  const { editorial } = BRAND;

  return (
    <section className="w-full bg-burgundy px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_auto_1.05fr] lg:items-center lg:gap-14">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">{editorial.kicker}</p>
          <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {editorial.title}
          </h2>
        </Reveal>
        <div className="hidden h-full min-h-[120px] w-px bg-gold lg:block" aria-hidden />
        <Reveal delay={0.08}>
          <div className="lg:pl-2">
            <p className="text-lg leading-8 text-white/90 sm:text-xl">{editorial.text}</p>
            <span className="mt-8 inline-block text-gold">
              <Sparkles className="h-6 w-6" />
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
