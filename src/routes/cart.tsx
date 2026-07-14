import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const cart = useCart();
  const { user } = useSession();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  async function checkout() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (cart.items.length === 0) return;
    setCheckingOut(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: user.id,
        total_cents: cart.total,
        currency: "USD",
        status: "pending",
      }).select().single();
      if (error) throw error;
      const items = cart.items.map((i) => ({
        order_id: order.id, product_id: i.productId, seller_id: i.sellerId,
        title: i.title, unit_price_cents: i.priceCents, quantity: i.quantity, image_url: i.imageUrl,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(items);
      if (e2) throw e2;
      cart.clear();
      toast.success("Order placed! (Payment integration coming soon)");
      navigate({ to: "/orders" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally { setCheckingOut(false); }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <h1 className="font-display text-4xl font-semibold mb-6">Your bag</h1>
        {cart.items.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-xl">Your bag is empty</p>
            <Link to="/shop" className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Shop now</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {cart.items.map((i) => (
                <div key={i.productId} className="glass rounded-2xl p-4 flex gap-4">
                  <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0">
                    {i.imageUrl && <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{i.title}</div>
                    <div className="text-sm text-primary font-bold">{formatMoney(i.priceCents)}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => cart.setQty(i.productId, i.quantity - 1)} className="glass h-7 w-7 rounded-full">−</button>
                      <span className="text-sm w-6 text-center">{i.quantity}</span>
                      <button onClick={() => cart.setQty(i.productId, i.quantity + 1)} className="glass h-7 w-7 rounded-full">+</button>
                    </div>
                  </div>
                  <button onClick={() => cart.remove(i.productId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="glass rounded-3xl p-6 h-fit">
              <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span>{formatMoney(cart.total)}</span></div>
              <div className="flex justify-between text-sm mb-2 text-muted-foreground"><span>Shipping</span><span>Calculated at checkout</span></div>
              <div className="border-t my-3" />
              <div className="flex justify-between font-display text-xl font-semibold"><span>Total</span><span className="text-primary">{formatMoney(cart.total)}</span></div>
              <button onClick={checkout} disabled={checkingOut} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {checkingOut ? "Placing order…" : "Checkout"}
              </button>
              <p className="mt-2 text-[10px] text-muted-foreground text-center">M-Pesa, cards & PayPal coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
