import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const cart = useCart();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <h1 className="font-display text-4xl font-semibold mb-6">Your bag</h1>
        {cart.items.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-xl">Your bag is empty</p>
            <Link to="/shop" search={{}} className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Shop now</Link>
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
              <div className="flex justify-between text-sm mb-2 text-muted-foreground"><span>Shipping</span><span>—</span></div>
              <div className="border-t my-3" />
              <div className="flex justify-between font-display text-xl font-semibold"><span>Total</span><span className="text-primary">{formatMoney(cart.total)}</span></div>
              <button disabled className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground opacity-60 cursor-not-allowed">
                Checkout coming soon
              </button>
              <p className="mt-2 text-[10px] text-muted-foreground text-center">Payments launching soon on MaeLove</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
