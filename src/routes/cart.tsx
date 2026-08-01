import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, ShoppingBag, Tag, Wallet, Truck, CreditCard, ArrowLeft, Check } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { BottomNav } from "@/components/ml/bottom-nav";
import { EmptyState } from "@/components/ml/states";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — MaeLove" },
      { name: "description", content: "Review your MaeLove bag, apply coupons, choose delivery and payment, and check out securely." },
      { property: "og:title", content: "Your Bag — MaeLove" },
      { property: "og:description", content: "Coupons, wallet, delivery and payment in one calm checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

const DELIVERY = [
  { id: "express", label: "Express", copy: "1–3 days", price: 1200 },
  { id: "standard", label: "Standard", copy: "3–7 days", price: 500 },
  { id: "pickup", label: "Boutique pickup", copy: "Ready today", price: 0 },
];

const PAYMENT = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "wallet", label: "MaeLove Wallet", icon: Wallet },
  { id: "mobile", label: "Mobile money", icon: Truck },
];

function CartPage() {
  const cart = useCart();
  const [delivery, setDelivery] = useState("standard");
  const [payment, setPayment] = useState("card");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | null>(null);

  const ship = DELIVERY.find((d) => d.id === delivery)?.price ?? 0;
  const discount = applied ? Math.round(cart.total * 0.1) : 0;
  const total = Math.max(0, cart.total - discount) + (cart.items.length ? ship : 0);

  return (
    <div className="min-h-screen pb-40">
      <header className="flex items-center gap-3 px-5 pb-2 pt-8">
        <Link to="/" aria-label="Back" className="press glass flex h-11 w-11 items-center justify-center rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[30px] font-black leading-none tracking-tight">Your bag</h1>
      </header>

      {cart.items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Your bag is empty"
            copy="Pieces you add will appear here, saved across devices."
            action={<Link to="/explore" className="press glass-cherry rounded-full px-6 py-3 text-sm font-extrabold">Start shopping</Link>}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3 px-5">
            {cart.items.map((i) => (
              <div key={i.productId} className="glass flex gap-4 rounded-3xl p-3">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {i.imageUrl && <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-[13px] font-bold leading-snug">{i.title}</div>
                  <div className="mt-1 text-base font-black">{formatMoney(i.priceCents)}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => cart.setQty(i.productId, i.quantity - 1)} aria-label="Decrease quantity" className="press glass h-8 w-8 rounded-full text-sm font-black">−</button>
                    <span className="w-6 text-center text-sm font-bold">{i.quantity}</span>
                    <button onClick={() => cart.setQty(i.productId, i.quantity + 1)} aria-label="Increase quantity" className="press glass h-8 w-8 rounded-full text-sm font-black">+</button>
                  </div>
                </div>
                <button onClick={() => cart.remove(i.productId)} aria-label="Remove item" className="press h-9 w-9 text-muted-foreground hover:text-primary">
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-8 px-5">
            <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5">
              <Tag className="h-4 w-4 text-primary" />
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code"
                aria-label="Coupon code"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => setApplied(coupon.trim() || null)} className="press rounded-full bg-foreground px-4 py-2 text-[12px] font-extrabold text-background">
                Apply
              </button>
            </div>
            {applied && (
              <div className="mt-2 flex items-center gap-1.5 px-2 text-[12px] font-bold text-primary">
                <Check className="h-3.5 w-3.5" /> “{applied}” applied — 10% off
              </div>
            )}
          </div>

          {/* Delivery */}
          <section className="mt-8 px-5">
            <h2 className="mb-3 text-[15px] font-black tracking-tight">Delivery</h2>
            <div className="space-y-2">
              {DELIVERY.map((d) => (
                <button key={d.id} onClick={() => setDelivery(d.id)} className={`press flex w-full items-center gap-3 rounded-3xl px-5 py-4 text-left ${delivery === d.id ? "glass-blush" : "glass"}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${delivery === d.id ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {delivery === d.id && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13px] font-bold">{d.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{d.copy}</span>
                  </span>
                  <span className="text-[13px] font-black">{d.price ? formatMoney(d.price) : "Free"}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="mt-8 px-5">
            <h2 className="mb-3 text-[15px] font-black tracking-tight">Payment</h2>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setPayment(id)} className={`press flex flex-col items-center gap-2 rounded-3xl px-2 py-4 ${payment === id ? "glass-blush" : "glass"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-center text-[11px] font-bold leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Summary */}
          <section className="mt-8 px-5">
            <div className="glass rounded-3xl p-5">
              <h2 className="mb-4 text-[15px] font-black tracking-tight">Order summary</h2>
              <Row label="Subtotal" value={formatMoney(cart.total)} />
              {discount > 0 && <Row label="Discount" value={`−${formatMoney(discount)}`} accent />}
              <Row label="Delivery" value={ship ? formatMoney(ship) : "Free"} />
              <div className="my-4 border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-black">Total</span>
                <span className="text-2xl font-black tracking-tight">{formatMoney(total)}</span>
              </div>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 px-5 pb-24 pt-4" style={{ background: "linear-gradient(0deg, var(--background) 62%, transparent)" }}>
            <button className="press glass-cherry w-full rounded-full py-4 text-sm font-extrabold">
              Checkout · {formatMoney(total)}
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
