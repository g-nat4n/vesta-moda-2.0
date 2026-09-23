import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function CategoryTiles() {
  const { categories } = BRAND;

  return (
    <section id="categorias" className="w-full bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-xl font-semibold uppercase tracking-[0.12em] text-ink sm:text-2xl">
          {categories.title}
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {categories.chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="group relative aspect-[3/4] overflow-hidden bg-sand"
            >
              <Image
                src={chip.image}
                alt={chip.label}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-ink/35 transition group-hover:bg-ink/45" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center py-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
                {chip.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
