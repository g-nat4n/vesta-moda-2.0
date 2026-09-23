"use client";

import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { CONDITION_LABELS } from "@/lib/constants";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { cn } from "@/lib/utils";

type Facets = {
  brands: string[];
  sizes: string[];
  categories: { name: string; slug: string }[];
};

export function CatalogFilters({
  facets,
  current,
}: {
  facets: Facets;
  current: Record<string, string | number | undefined>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(typeof current.q === "string" ? current.q : "");

  useEffect(() => {
    setQuery(typeof current.q === "string" ? current.q : "");
  }, [current.q]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `/produtos?${qs}` : "/produtos");
  }

  function clearAll() {
    setQuery("");
    router.push("/produtos");
  }

  function applySearch() {
    update("q", query.trim());
  }

  const activeCount = [
    current.q,
    current.category,
    current.size,
    current.brand,
    current.condition,
    current.availability && current.availability !== "available" ? current.availability : "",
  ].filter(Boolean).length;

  const hasFilters = activeCount > 0;

  const filterBody = (
    <div className="space-y-5">
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-taupe">
        Busca
        <input
          value={query}
          name="q"
          placeholder="Buscar peça"
          className="mt-2 h-11 w-full border border-line bg-white px-3 text-sm text-ink outline-none focus:border-ink"
          onChange={(event) => setQuery(event.target.value)}
          onBlur={applySearch}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applySearch();
            }
          }}
        />
      </label>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-taupe">Categoria</p>
        <div className="mt-2 space-y-1.5">
          <FilterChip active={!current.category} label="Todas" onClick={() => update("category", "")} />
          {facets.categories.map((category) => (
            <FilterChip
              key={category.slug}
              active={current.category === category.slug}
              label={category.name}
              onClick={() =>
                update("category", current.category === category.slug ? "" : category.slug)
              }
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-taupe">Tamanho</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {facets.sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => update("size", current.size === size ? "" : size)}
              className={cn(
                "min-w-10 border px-2.5 py-1.5 text-xs font-semibold transition",
                current.size === size
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink hover:border-ink",
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-taupe">Marca</p>
        <BrandSelect
          label="Marca"
          value={String(current.brand ?? "")}
          onChange={(value) => update("brand", value)}
          triggerClassName="mt-2 h-11 py-0"
          options={[
            { value: "", label: "Todas" },
            ...facets.brands.map((brand) => ({ value: brand, label: brand })),
          ]}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-taupe">Condição</p>
        <BrandSelect
          label="Condição"
          value={String(current.condition ?? "")}
          onChange={(value) => update("condition", value)}
          triggerClassName="mt-2 h-11 py-0"
          options={[
            { value: "", label: "Todas" },
            ...Object.entries(CONDITION_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-taupe">Disponibilidade</p>
        <BrandSelect
          label="Disponibilidade"
          value={String(current.availability ?? "available")}
          onChange={(value) => update("availability", value)}
          triggerClassName="mt-2 h-11 py-0"
          options={[
            { value: "available", label: "Disponíveis" },
            { value: "sold", label: "Vendidas" },
            { value: "all", label: "Todas" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <aside className="border border-line bg-cream lg:p-5">
      {/* Mobile: barra compacta */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-11 flex-1 items-center justify-between gap-3 px-1 text-left"
          >
            <span className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-4 w-4 text-gold" aria-hidden />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-ink">Filtros</span>
              {hasFilters ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center bg-gold px-1.5 text-[10px] font-bold text-ink">
                  {activeCount}
                </span>
              ) : null}
            </span>
            <ChevronDown
              className={cn("h-4 w-4 text-taupe transition duration-300", open && "rotate-180")}
              aria-hidden
            />
          </button>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="shrink-0 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold"
            >
              Limpar
            </button>
          ) : null}
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              id={panelId}
              key="filters-panel"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line"
            >
              <div className="px-4 pb-5 pt-4">
                {filterBody}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-5 flex w-full items-center justify-center gap-2 border border-ink bg-ink px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white"
                >
                  Ver resultados
                  <X className="h-3.5 w-3.5 opacity-70" aria-hidden />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Desktop: sempre aberto */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">Filtro</h2>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-gold hover:underline"
            >
              Limpar
            </button>
          ) : null}
        </div>
        <div className="mt-5">{filterBody}</div>
      </div>
    </aside>
  );
}

export function CatalogSortBar({
  current,
  resultCount,
}: {
  current: Record<string, string | number | undefined>;
  resultCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `/produtos?${qs}` : "/produtos");
  }

  return (
    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-taupe">
        Você está vendo <span className="font-semibold text-ink">{resultCount}</span>{" "}
        {resultCount === 1 ? "resultado" : "resultados"}
      </p>
      <div className="w-full sm:w-56">
        <BrandSelect
          label="Ordenar"
          value={String(current.sort ?? "recent")}
          onChange={(value) => update("sort", value)}
          triggerClassName="h-11 py-0"
          options={[
            { value: "recent", label: "Mais recentes" },
            { value: "price-asc", label: "Preço: menor → maior" },
            { value: "price-desc", label: "Preço: maior → menor" },
            { value: "name", label: "Nome A–Z" },
          ]}
        />
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full border px-3 py-2 text-left text-sm transition",
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
      )}
    >
      {label}
    </button>
  );
}

/** @deprecated use CatalogFilters + CatalogSortBar */
export function CatalogToolbar(props: {
  facets: Facets;
  current: Record<string, string | number | undefined>;
  resultCount?: number;
}) {
  return <CatalogFilters facets={props.facets} current={props.current} />;
}
