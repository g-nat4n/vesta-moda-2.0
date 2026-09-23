import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-ink text-white hover:bg-wine",
  burgundy: "bg-burgundy text-ivory hover:bg-wine",
  gold: "bg-gold text-white hover:bg-gold-deep",
  wine: "bg-wine text-ivory hover:bg-[#650000]",
  outline:
    "border border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
  ghost:
    "border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white",
  light: "bg-ivory text-ink hover:bg-cream",
};

type Props = {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: LinkProps["href"] } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">)
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
);

export function Button({ variant = "primary", className, children, ...props }: Props) {
  const classes = cn(
    "inline-flex min-h-12 items-center justify-center gap-2 px-7 text-[11px] font-bold uppercase tracking-[0.18em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );

  if ("href" in props && props.href) {
    const { href, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
