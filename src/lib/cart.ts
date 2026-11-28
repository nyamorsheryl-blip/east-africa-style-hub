import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session"; import { useMoney } from "@/lib/money";

export interface CartItem {
  productId: string;
  title: string;
  priceCents: number;  currency?: string;
  imageUrl?: string;
  sellerId: string;
  quantity: number;
  /** chosen size and colour; empty string when the product has no options */
  size?: string;
  color?: string;
  /** true when the product was unpublished, deleted or sold out */
  unavailable?: boolean;
}

const KEY = "maelove.cart";

// The same product in a different size or colour is a separate bag line.
const sameLine = (c: { productId: string; size?: string; color?: string }, productId: string, size = "", color = "") =>
  c.productId === productId && (c.size ?? "") === size && (c.color ?? "") === color;

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
  size: string | null;
  color: string | null;
  products: {
    title: string | null;
    price_cents: number | null;    currency: string | null;
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
    priceCents: p?.sale_price_cents ?? p?.price_cents ?? 0, currency: p?.currency ?? "USD",
    imageUrl: p?.images?.[0],
    sellerId: p?.owner_id ?? "",
    quantity: r.quantity,
    size: r.size ?? "",
    color: r.color ?? "",
    unavailable: !p || p.published === false || (p.stock !== null && p.stock <= 0),
  };
}

async function fetchRemote(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity, size, color, products(title, price_cents, sale_price_cents, currency, images, owner_id, published, stock)")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(rowToItem);
}

// Insert or update one bag line (product + size + colour).
async function writeRemote(userId: string, productId: string, size: string, color: string, quantity: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: row } = await db.from("cart_items").select("id")
    .eq("user_id", userId).eq("product_id", productId).eq("size", size).eq("color", color).maybeSingle();
  if (row) return db.from("cart_items").update({ quantity }).eq("id", row.id);
  return db.from("cart_items").insert({ user_id: userId, product_id: productId, quantity, size, color });
}

/**
 * Cart state. Signed-out shoppers use localStorage; signed-in shoppers are
 * synced to the backend so their bag follows them across devices. Any local
 * guest bag is merged into the account on sign-in.
 */
export function useCart() {
  const { user } = useSession();
  const userId = user?.id; const money = useMoney();
  const [items, setItems] = useState<CartItem[]>([]);
  const merged = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) { setItems(read()); return; }
    try { setItems(await fetchRemote(userId)); } catch { /* keep last known */ }
  }, [userId]);

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
            const gs = g.size ?? "", gc = g.color ?? "";
            const existing = remote.find((r) => sameLine(r, g.productId, gs, gc));
            await writeRemote(userId, g.productId, gs, gc, (existing?.quantity ?? 0) + g.quantity);
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
  useEffect(() => {
    if (!userId) return;

    const topic = `cart-${userId}`;

    // Reuse an existing channel for this user (React Strict Mode runs setup twice in dev).
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
    const size = item.size ?? "", color = item.color ?? "";
    if (!userId) {
      const cur = read();
      const ex = cur.find((c) => sameLine(c, item.productId, size, color));
      if (ex) ex.quantity += qty; else cur.push({ ...item, size, color, quantity: qty });
      write(cur);
      return;
    }
    const existing = items.find((c) => sameLine(c, item.productId, size, color));
    setItems((prev) => existing
      ? prev.map((c) => sameLine(c, item.productId, size, color) ? { ...c, quantity: c.quantity + qty } : c)
      : [...prev, { ...item, size, color, quantity: qty }]);
    await writeRemote(userId, item.productId, size, color, (existing?.quantity ?? 0) + qty);
    await refresh();
  }, [userId, items, refresh]);

  // size / colour are optional: leave them out to remove every variant of the product.
  const remove = useCallback(async (productId: string, size?: string, color?: string) => {
    const hit = (c: CartItem) => c.productId === productId
      && (size === undefined || (c.size ?? "") === size)
      && (color === undefined || (c.color ?? "") === color);
    if (!userId) { write(read().filter((c) => !hit(c))); return; }
    setItems((prev) => prev.filter((c) => !hit(c)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any).from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
    if (size !== undefined) q = q.eq("size", size);
    if (color !== undefined) q = q.eq("color", color);
    await q;
    await refresh();
  }, [userId, refresh]);

  const setQty = useCallback(async (productId: string, qty: number, size?: string, color?: string) => {
    const next = Math.max(1, qty);
    const hit = (c: CartItem) => c.productId === productId
      && (size === undefined || (c.size ?? "") === size)
      && (color === undefined || (c.color ?? "") === color);
    if (!userId) {
      write(read().map((c) => hit(c) ? { ...c, quantity: next } : c));
      return;
    }
    setItems((prev) => prev.map((c) => hit(c) ? { ...c, quantity: next } : c));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any).from("cart_items").update({ quantity: next }).eq("user_id", userId).eq("product_id", productId);
    if (size !== undefined) q = q.eq("size", size);
    if (color !== undefined) q = q.eq("color", color);
    await q;
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
    total: available.reduce((s, i) => s + (money.convert(i.priceCents, i.currency) ?? i.priceCents) * i.quantity, 0),
    count: available.reduce((s, i) => s + i.quantity, 0),
  };
}