"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ImageItem = { url: string; alt: string };

export function ProductGallery({
  images,
  name,
  sold,
}: {
  images: ImageItem[];
  name: string;
  sold?: boolean;
}) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [];
  const current = list[active] ?? list[0];

  if (!current) {
    return <div className="mx-4 aspect-[3/4] max-h-[52vh] bg-cream" />;
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-0">
      {/* Mobile: foto menor + caixinhas embaixo */}
      <div className="lg:hidden">
        <div className="relative mx-auto aspect-[3/4] max-h-[52vh] w-[88%] overflow-hidden bg-cream">
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            className={cn("object-cover", sold && "grayscale")}
            sizes="(max-width: 768px) 88vw, 400px"
          />
          {sold ? (
            <span className="absolute left-2.5 top-2.5 bg-ink px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
              Vendida
            </span>
          ) : null}
        </div>

        {list.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2.5">
            {list.map((image, index) => (
              <button
                key={image.url + index}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "relative h-[4.75rem] w-[3.6rem] shrink-0 overflow-hidden border-2 bg-cream transition",
                  index === active ? "border-gold" : "border-line",
                )}
                aria-label={`Ver imagem ${index + 1} de ${name}`}
                aria-current={index === active}
              >
                <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="58px" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[80px_1fr]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col">
          {list.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden border",
                index === active ? "border-gold" : "border-transparent",
              )}
              aria-label={`Ver imagem ${index + 1} de ${name}`}
            >
              <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
        <div className="relative aspect-[3/4] overflow-hidden bg-cream">
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            className={cn("object-cover", sold && "grayscale")}
            sizes="50vw"
          />
          {sold ? (
            <span className="absolute left-4 top-4 bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              Vendida
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
