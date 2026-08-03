import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

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

type Row = {
  product_id: string;
  quantity: number;
  products: {
    title: string | null;
    price_cents: number | null;
    sale_price_cents: number | null;
    images: string[] | null;
    owner_id: string | null;
  } | null;
};

function rowToItem(r: Row): CartItem {
  const p = r.products;
  return {
    productId: r.product_id,
    title: p?.title ?? "Item",
    priceCents: p?.sale_price_cents ?? p?.price_cents ?? 0,
    imageUrl: p?.images?.[0],
    sellerId: p?.owner_id ?? "",
    quantity: r.quantity,
  };
}

async function fetchRemote(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity, products(title, price_cents, sale_price_cents, images, owner_id)")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(rowToItem);
}

/**
 * Cart state. Signed-out shoppers use localStorage; signed-in shoppers are
 * synced to the backend so their bag follows them across devices. Any local
 * guest bag is merged into the account on sign-in.
 */
export function useCart() {
  const { user } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const merged = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setItems(read()); return; }
    try { setItems(await fetchRemote(user.id)); } catch { /* keep last known */ }
  }, [user]);

  // Local (guest) cart events
  useEffect(() => {
    if (user) return;
    setItems(read());
    const on = () => setItems(read());
    window.addEventListener("maelove:cart", on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener("maelove:cart", on); window.removeEventListener("storage", on); };
  }, [user]);

  // Remote cart: load + merge guest bag once per user
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const guest = read();
      if (guest.length && merged.current !== user.id) {
        merged.current = user.id;
        try {
          const remote = await fetchRemote(user.id);
          for (const g of guest) {
            const existing = remote.find((r) => r.productId === g.productId);
            await supabase.from("cart_items").upsert(
              { user_id: user.id, product_id: g.productId, quantity: (existing?.quantity ?? 0) + g.quantity },
              { onConflict: "user_id,product_id" },
            );
          }
          localStorage.removeItem(KEY);
        } catch { /* ignore merge failure */ }
      }
      if (!cancelled) await refresh();
    })();
    const on = () => { void refresh(); };
    window.addEventListener("maelove:cart", on);
    return () => { cancelled = true; window.removeEventListener("maelove:cart", on); };
  }, [user, refresh]);

  const add = useCallback(async (item: Omit<CartItem, "quantity">, qty = 1) => {
    if (!user) {
      const cur = read();
      const ex = cur.find((c) => c.productId === item.productId);
      if (ex) ex.quantity += qty; else cur.push({ ...item, quantity: qty });
      write(cur);
      return;
    }
    const existing = items.find((c) => c.productId === item.productId);
    setItems((prev) => existing
      ? prev.map((c) => c.productId === item.productId ? { ...c, quantity: c.quantity + qty } : c)
      : [...prev, { ...item, quantity: qty }]);
    await supabase.from("cart_items").upsert(
      { user_id: user.id, product_id: item.productId, quantity: (existing?.quantity ?? 0) + qty },
      { onConflict: "user_id,product_id" },
    );
    await refresh();
  }, [user, items, refresh]);

  const remove = useCallback(async (productId: string) => {
    if (!user) { write(read().filter((c) => c.productId !== productId)); return; }
    setItems((prev) => prev.filter((c) => c.productId !== productId));
    await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
    await refresh();
  }, [user, refresh]);

  const setQty = useCallback(async (productId: string, qty: number) => {
    const next = Math.max(1, qty);
    if (!user) {
      write(read().map((c) => c.productId === productId ? { ...c, quantity: next } : c));
      return;
    }
    setItems((prev) => prev.map((c) => c.productId === productId ? { ...c, quantity: next } : c));
    await supabase.from("cart_items").update({ quantity: next }).eq("user_id", user.id).eq("product_id", productId);
    await refresh();
  }, [user, refresh]);

  const clear = useCallback(async () => {
    if (!user) { write([]); return; }
    setItems([]);
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  return {
    items,
    synced: !!user,
    add,
    remove,
    setQty,
    clear,
    total: items.reduce((s, i) => s + i.priceCents * i.quantity, 0),
    count: items.reduce((s, i) => s + i.quantity, 0),
  };
}
