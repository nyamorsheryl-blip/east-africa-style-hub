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
  /** true when the product was unpublished, deleted or sold out */
  unavailable?: boolean;
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
    published: boolean | null;
    stock: number | null;
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
    unavailable: !p || p.published === false || (p.stock !== null && p.stock <= 0),
  };
}

async function fetchRemote(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity, products(title, price_cents, sale_price_cents, images, owner_id, published, stock)")
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
  const userId = user?.id;
  const [items, setItems] = useState<CartItem[]>([]);
  const merged = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) { setItems(read()); return; }
    try { setItems(await fetchRemote(userId)); } catch { /* keep last known */ }
  }, [userId]);

  // Always call the latest refresh from stable effects below, without making
  // refresh itself a dependency (its identity can still change harmlessly).
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  // Local (guest) cart events
  useEffect(() => {
    if (userId) return;
    setItems(read());
    const on = () => setItems(read());
    window.addEventListener("maelove:cart", on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener("maelove:cart", on); window.removeEventListener("storage", on); };
  }, [userId]);

  // Remote cart: load once + merge any guest bag, keyed only on the user id
  // so it doesn't re-run just because `user` or `refresh` got a new identity.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const guest = read();
      if (guest.length && merged.current !== userId) {
        merged.current = userId;
        try {
          const remote = await fetchRemote(userId);
          for (const g of guest) {
            const existing = remote.find((r) => r.productId === g.productId);
            await supabase.from("cart_items").upsert(
              { user_id: userId, product_id: g.productId, quantity: (existing?.quantity ?? 0) + g.quantity },
              { onConflict: "user_id,product_id" },
            );
          }
          localStorage.removeItem(KEY);
        } catch { /* ignore merge failure */ }
      }
      if (!cancelled) await refreshRef.current();
    })();
    const on = () => { void refreshRef.current(); };
    window.addEventListener("maelove:cart", on);
    return () => {
      cancelled = true;
      window.removeEventListener("maelove:cart", on);
    };
  }, [userId]);

  // Live updates: any change to this shopper's cart rows, or to a product in
  // it (price, stock, published), refreshes badge + totals instantly.
  // Kept in its own effect, keyed only on the user id, so it is created
  // exactly once per login and torn down exactly once per logout — no
  // rebuild races with an in-flight subscribe() on the same channel name.
    useEffect(() => {
    if (!userId) return;

    const topic = `cart-${userId}`;

    // In dev, React's Strict Mode runs this effect's setup twice in a row
    // before the first cleanup has finished removing the old channel. If we
    // blindly created a new channel every time, the second run could end up
    // attaching new .on() listeners to a channel that's already subscribed,
    // which is exactly the error this guard avoids: reuse the existing
    // channel for this user instead of creating a duplicate.
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${topic}`);
    const channel = existing ?? supabase
      .channel(topic)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` },
        () => { void refreshRef.current(); })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => { void refreshRef.current(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const add = useCallback(async (item: Omit<CartItem, "quantity">, qty = 1) => {
    if (!userId) {
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
      { user_id: userId, product_id: item.productId, quantity: (existing?.quantity ?? 0) + qty },
      { onConflict: "user_id,product_id" },
    );
    await refresh();
  }, [userId, items, refresh]);

  const remove = useCallback(async (productId: string) => {
    if (!userId) { write(read().filter((c) => c.productId !== productId)); return; }
    setItems((prev) => prev.filter((c) => c.productId !== productId));
    await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
    await refresh();
  }, [userId, refresh]);

  const setQty = useCallback(async (productId: string, qty: number) => {
    const next = Math.max(1, qty);
    if (!userId) {
      write(read().map((c) => c.productId === productId ? { ...c, quantity: next } : c));
      return;
    }
    setItems((prev) => prev.map((c) => c.productId === productId ? { ...c, quantity: next } : c));
    await supabase.from("cart_items").update({ quantity: next }).eq("user_id", userId).eq("product_id", productId);
    await refresh();
  }, [userId, refresh]);

  const clear = useCallback(async () => {
    if (!userId) { write([]); return; }
    setItems([]);
    await supabase.from("cart_items").delete().eq("user_id", userId);
    await refresh();
  }, [userId, refresh]);

  const available = items.filter((i) => !i.unavailable);

  return {
    items,
    available,
    unavailable: items.filter((i) => i.unavailable),
    synced: !!userId,
    add,
    remove,
    setQty,
    clear,
    total: available.reduce((s, i) => s + i.priceCents * i.quantity, 0),
    count: available.reduce((s, i) => s + i.quantity, 0),
  };
}