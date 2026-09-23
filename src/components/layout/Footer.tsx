import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SOCIAL = {
  instagram: "https://www.instagram.com/vesta.preowned/",
  facebook: null as string | null,
  whatsapp: null as string | null,
} as const;

const CREDIT = {
  site: "https://grupocostabr.com.br/",
  instagram: "https://www.instagram.com/grupocostabrasil/",
} as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-gold hover:text-gold";

  if (!href) {
    return (
      <span className={cn(className, "cursor-default opacity-45")} title={`${label} em breve`} aria-label={`${label} em breve`}>
        {children}
      </span>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={className}>
      {children}
    </a>
  );
}

export function Footer({ className }: { className?: string }) {
  const { footer } = BRAND;

  return (
    <footer className={cn("mt-auto w-full border-t border-line bg-ink px-6 py-14 text-white lg:px-8", className)}>
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl tracking-[0.15em] text-white">{BRAND.footerBrand}</p>
          <p className="mt-4 font-serif text-xl italic text-white/80">{BRAND.phrase}</p>
          <span className="mt-6 inline-block h-px w-12 bg-gold" aria-hidden />
        </div>
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{footer.navTitle}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/75">
            {NAV_LINKS.filter((link) => link.label !== "Início").map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-gold">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{footer.serviceTitle}</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">{footer.serviceText}</p>
          <div className="mt-5 flex items-center gap-2.5">
            <SocialLink href={SOCIAL.instagram} label="Instagram Vesta">
              <Instagram className="h-4 w-4" strokeWidth={1.75} />
            </SocialLink>
            <SocialLink href={SOCIAL.facebook} label="Facebook Vesta">
              <Facebook className="h-4 w-4" strokeWidth={1.75} />
            </SocialLink>
            <SocialLink href={SOCIAL.whatsapp} label="WhatsApp Vesta">
              <WhatsAppIcon className="h-4 w-4" />
            </SocialLink>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-7xl gap-4 border-t border-white/15 pt-6 text-xs text-white/50 sm:grid-cols-3 sm:items-center">
        <p>{footer.copy}</p>

        <p className="flex flex-wrap items-center gap-x-1.5 text-white/70 sm:justify-center">
          <span>Site construído por</span>
          <a
            href={CREDIT.site}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white transition hover:text-gold"
          >
            Grupo Costa Brasil
          </a>
          <a
            href={CREDIT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Grupo Costa Brasil"
            className="ml-0.5 inline-flex text-white/80 transition hover:text-gold"
          >
            <Instagram className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </p>

        <a href="#topo" className="font-bold text-gold sm:justify-self-end">
          {BRAND.backTop}
        </a>
      </div>
    </footer>
  );
}
