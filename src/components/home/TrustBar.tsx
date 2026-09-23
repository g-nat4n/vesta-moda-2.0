import { Smartphone, Sparkles, ShieldCheck, Truck } from "lucide-react";
import { BRAND } from "@/lib/brand";

const ICONS = [Smartphone, Sparkles, ShieldCheck, Truck] as const;

export function TrustBar() {
  return (
    <section className="w-full border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto px-6 py-5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {BRAND.trust.map((item, index) => {
          const Icon = ICONS[index] ?? Sparkles;
          return (
            <div key={item.label} className="flex min-w-[200px] items-center gap-3 sm:min-w-0">
              <span className="text-gold">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-xs text-taupe">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
