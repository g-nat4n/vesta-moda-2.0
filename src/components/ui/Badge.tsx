import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "gold",
  className,
}: {
  children: React.ReactNode;
  tone?: "gold" | "wine" | "ink";
  className?: string;
}) {
  const tones = {
    gold: "bg-gold/15 text-gold-deep",
    wine: "bg-wine/10 text-wine",
    ink: "bg-ink/10 text-ink",
  };

  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
