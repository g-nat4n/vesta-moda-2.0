"use client";

import { useEffect, useRef, useState } from "react";

/** Fileiras visíveis por vez (mobile 2 cols, md+ 3 cols). */
const ROWS = 3;

export function pageSizeForWidth(width: number) {
  if (width >= 768) return 3 * ROWS;
  return 2 * ROWS;
}

export function useInfiniteCatalog(itemCount: number, signature: string) {
  const [pageSize, setPageSize] = useState(2 * ROWS);
  const [visible, setVisible] = useState(2 * ROWS);
  const [loading, setLoading] = useState(false);
  const [revealFrom, setRevealFrom] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      setPageSize(pageSizeForWidth(window.innerWidth));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setVisible(pageSize);
    setRevealFrom(0);
    setLoading(false);
  }, [signature, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || visible >= itemCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setLoading(true);
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, itemCount, visible]);

  useEffect(() => {
    if (!loading) return;
    const from = visible;
    const timer = window.setTimeout(() => {
      setRevealFrom(from);
      setVisible((current) => Math.min(current + pageSize, itemCount));
      setLoading(false);
    }, 480);
    return () => window.clearTimeout(timer);
  }, [loading, pageSize, itemCount, visible]);

  return { visible, loading, revealFrom, sentinelRef, hasMore: visible < itemCount };
}
