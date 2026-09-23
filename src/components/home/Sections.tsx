import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/home/ContactForm";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/lib/brand";

export { EditorialLook } from "@/components/home/EditorialLook";

export function ContactBand() {
  const { contact } = BRAND;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/";

  return (
    <section id="contato" className="w-full border-t border-line bg-white px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">{contact.kicker}</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            {contact.title}
          </h2>
          <p className="mt-6 max-w-md leading-7 text-taupe">{contact.text}</p>
          <div className="mt-10 space-y-3">
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm font-semibold text-ink transition hover:text-gold"
            >
              <Instagram className="h-[19px] w-[19px]" />
              {BRAND.instagramLabel}
            </a>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm font-semibold text-ink transition hover:text-gold"
            >
              <MessageCircle className="h-[19px] w-[19px]" />
              {BRAND.whatsappLabel}
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
