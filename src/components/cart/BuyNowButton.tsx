"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import type { CartItem } from "@/types";

export function BuyNowButton({
  item,
  sold,
  className,
}: {
  item: CartItem;
  sold?: boolean;
  className?: string;
}) {
  const { addItem } = useCart();
  const router = useRouter();

  if (sold) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "w-full"}
      onClick={() => {
        addItem(item);
        router.push("/checkout");
      }}
    >
      Comprar agora
    </Button>
  );
}
