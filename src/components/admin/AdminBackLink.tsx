import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AdminBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-taupe transition hover:text-burgundy"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}
