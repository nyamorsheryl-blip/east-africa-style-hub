import { useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
  sellerId: string;
  quantity: number;
}

const KEY = "maelove.cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("maelove:cart"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const on = () => setItems(read());
    window.addEventListener("maelove:cart", on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener("maelove:cart", on); window.removeEventListener("storage", on); };
  }, []);
  return {
    items,
    add: (item: Omit<CartItem, "quantity">, qty = 1) => {
      const cur = read();
      const ex = cur.find((c) => c.productId === item.productId);
      if (ex) ex.quantity += qty; else cur.push({ ...item, quantity: qty });
      write(cur);
    },
    remove: (productId: string) => write(read().filter((c) => c.productId !== productId)),
    setQty: (productId: string, qty: number) => {
      const cur = read().map((c) => c.productId === productId ? { ...c, quantity: Math.max(1, qty) } : c);
      write(cur);
    },
    clear: () => write([]),
    total: items.reduce((s, i) => s + i.priceCents * i.quantity, 0),
    count: items.reduce((s, i) => s + i.quantity, 0),
  };
}
