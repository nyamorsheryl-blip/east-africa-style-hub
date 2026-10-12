import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useEffect, useState } from "react";

import { Trash2, ShoppingBag, Tag, Truck, ArrowLeft, Check, AlertCircle, Smartphone, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { useCart } from "@/lib/cart";

import { formatMoney } from "@/lib/format";

import { supabase } from "@/integrations/supabase/client";

import { useSession } from "@/hooks/use-session";

import { BottomNav } from "@/components/ml/bottom-nav";

import { EmptyState } from "@/components/ml/states";

import { TopBar } from "@/components/ml/top-bar";



export const Route = createFileRoute("/cart")({

  head: () => ({

    meta: [

      { title: "Your Bag — MaeLove" },

      { name: "description", content: "Review your MaeLove bag, apply coupons, choose delivery and pay with M-Pesa." },

      { property: "og:title", content: "Your Bag — MaeLove" },

      { property: "og:description", content: "Coupons, delivery and M-Pesa checkout in one calm flow." },

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



type Step = "review" | "address" | "paying" | "success" | "failed";



type AppliedCoupon = {

  seller_id: string;

  coupon_id: string;

  discount_type: "percentage" | "fixed";

  discount_value: number;

};



function CartPage() {

  const cart = useCart();

  const { user } = useSession();

  const navigate = useNavigate();



  const [delivery, setDelivery] = useState("standard");

  const [coupon, setCoupon] = useState("");

  const [applying, setApplying] = useState(false);

  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);

  const [couponError, setCouponError] = useState<string | null>(null);



  const [step, setStep] = useState<Step>("review");

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [addressLine, setAddressLine] = useState("");

  const [city, setCity] = useState("");

  const [orderId, setOrderId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [customerMessage, setCustomerMessage] = useState<string | null>(null);



  const ship = DELIVERY.find((d) => d.id === delivery)?.price ?? 0;



  function discountForCoupon(c: AppliedCoupon) {

    const sellerSubtotal = cart.available

      .filter((i) => i.sellerId === c.seller_id)

      .reduce((s, i) => s + i.priceCents * i.quantity, 0);

    if (c.discount_type === "percentage") return Math.round((sellerSubtotal * c.discount_value) / 100);

    return Math.min(sellerSubtotal, c.discount_value);

  }



  const discount = appliedCoupons.reduce((sum, c) => sum + discountForCoupon(c), 0);

  const total = Math.max(0, cart.total - discount) + (cart.items.length ? ship : 0);



  async function applyCoupon() {

    const code = coupon.trim();

    if (!code) return;

    const sellerIds = [...new Set(cart.available.map((i) => i.sellerId))];

    if (sellerIds.length === 0) return;



    setApplying(true);

    setCouponError(null);

    const { data, error: rpcErr } = await supabase.rpc("validate_coupon", { p_code: code, p_seller_ids: sellerIds });

    setApplying(false);



    if (rpcErr) {

      setCouponError("Couldn't check that code. Try again.");

      return;

    }

    if (!data || data.length === 0) {

      setCouponError("That code isn't valid for items in your bag.");

      setAppliedCoupons([]);

      setAppliedCode(null);

      return;

    }

    setAppliedCoupons(data as AppliedCoupon[]);

    setAppliedCode(code);

  }



  function removeCoupon() {

    setAppliedCoupons([]);

    setAppliedCode(null);

    setCoupon("");

    setCouponError(null);

  }



  function startCheckout() {

    if (cart.available.length === 0) return;

    if (!user) {

      navigate({ to: "/auth/login" });

      return;

    }

    setError(null);

    setStep("address");

  }



  async function triggerStkPush(oid: string, phoneNumber: string) {

    setStep("paying");

    setError(null);

    const { data, error: invokeErr } = await supabase.functions.invoke("mpesa-stk-push", {

      body: { orderId: oid, phone: phoneNumber },

    });

    if (invokeErr || data?.error) {

      setError(data?.error || invokeErr?.message || "Payment request failed. Please try again.");

      setStep("failed");

      return;

    }

    setCustomerMessage(data?.customerMessage ?? "Check your phone and enter your M-Pesa PIN to complete payment.");

  }



  async function handleSubmitAddress(e: React.FormEvent) {

    e.preventDefault();

    if (!name.trim() || !phone.trim() || !addressLine.trim() || !city.trim()) {

      setError("Please fill in all fields.");

      return;

    }

    setError(null);



    // Retrying after a failed/cancelled payment on the same order — skip

    // creating a new order, just trigger a fresh STK push.

    if (orderId) {

      await triggerStkPush(orderId, phone);

      return;

    }



    if (!user) {

      navigate({ to: "/auth/login" });

      return;

    }



    setStep("paying");

    try {

      const { data: order, error: orderErr } = await supabase

        .from("orders")

        .insert({

          buyer_id: user.id,

          total_cents: total,

          currency: "USD",

          shipping_address: { name, phone, addressLine, city },

          coupon_code: appliedCode,

          discount_cents: discount,

        })

        .select()

        .single();

      if (orderErr || !order) throw orderErr ?? new Error("Could not create order");



      const items = cart.available.map((i) => ({

        order_id: order.id,

        product_id: i.productId,

        seller_id: i.sellerId,

        title: i.title,

        unit_price_cents: i.priceCents,

        quantity: i.quantity,

        image_url: i.imageUrl ?? null,

      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(items);

      if (itemsErr) throw itemsErr;



      // Redeem each applied coupon now that the order is placed. Guarded

      // server-side against reuse past its limit, so this is safe even if

      // two checkouts race on the same code.

      for (const c of appliedCoupons) {

        await supabase.rpc("redeem_coupon", { p_coupon_id: c.coupon_id });

      }



      setOrderId(order.id);

      await triggerStkPush(order.id, phone);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Something went wrong creating your order.");

      setStep("failed");

    }

  }



  // While waiting on M-Pesa: listen for the callback's update in real time,

  // with a short poll as a fallback in case the realtime event is missed.

  useEffect(() => {

    if (!orderId || step !== "paying") return;



    const channel = supabase

      .channel(`order-payment-${orderId}`)

      .on(

        "postgres_changes",

        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },

        (payload) => {

          const status = (payload.new as { payment_status?: string })?.payment_status;

          if (status === "paid") setStep("success");

          else if (status === "failed") {

            setError("Payment failed or was cancelled on your phone.");

            setStep("failed");

          }

        },

      )

      .subscribe();



    const poll = setInterval(async () => {

      const { data } = await supabase.from("orders").select("payment_status").eq("id", orderId).single();

      if (data?.payment_status === "paid") setStep("success");

      else if (data?.payment_status === "failed") {

        setError("Payment failed or was cancelled on your phone.");

        setStep("failed");

      }

    }, 4000);



    return () => {

      void supabase.removeChannel(channel);

      clearInterval(poll);

    };

  }, [orderId, step]);



  // Clear the bag once payment is confirmed.

  useEffect(() => {

    if (step === "success") void cart.clear();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [step]);



  return (

    <div className="page-enter min-h-screen pb-40">

      <TopBar title="Your bag" />

      <div className="px-5 pt-2">

        <Link to="/" aria-label="Continue shopping" className="press glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-[12px] font-bold">

          <ArrowLeft className="h-4 w-4" /> Continue shopping

        </Link>

      </div>



      {cart.items.length === 0 ? (

        <div className="mt-10">

          <EmptyState

            icon={<ShoppingBag className="h-5 w-5" />}

            title="Your bag is empty"

            copy="Pieces you add will appear here, saved across devices."

            action={<Link to="/explore" className="btn-base btn-primary">Start shopping</Link>}

          />

        </div>

      ) : (

        <>

          <div className="mt-6 space-y-3 px-5">

            {cart.items.map((i) => (

              <div key={i.productId} className={`card-ml slide-up flex gap-4 ${i.unavailable ? "opacity-70" : ""}`}>

                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">

                  {i.imageUrl && <img src={i.imageUrl} alt="" className={`h-full w-full object-cover ${i.unavailable ? "grayscale" : ""}`} />}

                </div>

                <div className="min-w-0 flex-1">

                  <div className="line-clamp-2 text-[13px] font-bold leading-snug">{i.title}</div>

                  {i.unavailable ? (

                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-extrabold text-muted-foreground">

                      <AlertCircle className="h-3.5 w-3.5" /> Unavailable — not counted

                    </div>

                  ) : (

                    <div className="mt-1 text-base font-black">{formatMoney(i.priceCents)}</div>

                  )}

                  {step === "review" && (

                    <div className="mt-3 flex items-center gap-2">

                      <button disabled={i.unavailable} onClick={() => cart.setQty(i.productId, i.quantity - 1)} aria-label="Decrease quantity" className="press glass h-8 w-8 rounded-full text-sm font-black disabled:opacity-40">−</button>

                      <span className="w-6 text-center text-sm font-bold">{i.quantity}</span>

                      <button disabled={i.unavailable} onClick={() => cart.setQty(i.productId, i.quantity + 1)} aria-label="Increase quantity" className="press glass h-8 w-8 rounded-full text-sm font-black disabled:opacity-40">+</button>

                    </div>

                  )}

                </div>

                {step === "review" && (

                  <button onClick={() => cart.remove(i.productId)} aria-label="Remove item" className="press h-9 w-9 text-muted-foreground hover:text-primary">

                    <Trash2 className="mx-auto h-4 w-4" />

                  </button>

                )}

              </div>

            ))}

            {cart.unavailable.length > 0 && (

              <p className="px-2 text-[12px] font-semibold text-muted-foreground">

                {cart.unavailable.length} item{cart.unavailable.length > 1 ? "s" : ""} became unavailable and {cart.unavailable.length > 1 ? "are" : "is"} excluded from your total.

              </p>

            )}

          </div>



          {step === "review" && (

            <>

              {/* Coupon */}

              <div className="mt-8 px-5">

                <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5">

                  <Tag className="h-4 w-4 text-primary" />

                  <input

                    value={coupon}

                    onChange={(e) => setCoupon(e.target.value)}

                    placeholder="Coupon code"

                    aria-label="Coupon code"

                    disabled={applying || !!appliedCode}

                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"

                  />

                  {appliedCode ? (

                    <button onClick={removeCoupon} className="press rounded-full bg-muted px-4 py-2 text-[12px] font-extrabold">

                      Remove

                    </button>

                  ) : (

                    <button onClick={applyCoupon} disabled={applying} className="press rounded-full bg-foreground px-4 py-2 text-[12px] font-extrabold text-background disabled:opacity-60">

                      {applying ? "…" : "Apply"}

                    </button>

                  )}

                </div>

                {appliedCode && discount > 0 && (

                  <div className="mt-2 flex items-center gap-1.5 px-2 text-[12px] font-bold text-primary">

                    <Check className="h-3.5 w-3.5" /> "{appliedCode}" applied — {formatMoney(discount)} off

                  </div>

                )}

                {couponError && (

                  <div className="mt-2 flex items-center gap-1.5 px-2 text-[12px] font-bold text-destructive">

                    <AlertCircle className="h-3.5 w-3.5" /> {couponError}

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



              {/* Payment — M-Pesa only for now */}

              <section className="mt-8 px-5">

                <h2 className="mb-3 text-[15px] font-black tracking-tight">Payment</h2>

                <div className="glass-blush flex items-center gap-3 rounded-3xl px-5 py-4">

                  <Smartphone className="h-4 w-4" />

                  <span className="text-[13px] font-bold">M-Pesa — you'll get a prompt on your phone</span>

                </div>

              </section>



              {/* Summary */}

              <section className="mt-8 px-5">

                <div className="card-ml p-5">

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

                <button disabled={cart.available.length === 0} onClick={startCheckout} className="btn-base btn-primary w-full py-4 disabled:opacity-50">

                  Checkout · {formatMoney(total)}

                </button>

              </div>

            </>

          )}



          {step === "address" && (

            <section className="mt-8 px-5 pb-10">

              <h2 className="mb-4 text-[15px] font-black tracking-tight">Delivery details</h2>

              <form onSubmit={handleSubmitAddress} className="space-y-3">

                <Field label="Full name" value={name} onChange={setName} placeholder="Jane Wanjiru" />

                <Field label="M-Pesa phone number" value={phone} onChange={setPhone} placeholder="07XX XXX XXX" type="tel" />

                <Field label="Address" value={addressLine} onChange={setAddressLine} placeholder="Street, building, apartment" />

                <Field label="City / Town" value={city} onChange={setCity} placeholder="Nairobi" />



                {error && (

                  <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-[12px] font-bold text-destructive">

                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}

                  </div>

                )}



                <div className="card-ml p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-[15px] font-black">Total</span>

                    <span className="text-2xl font-black tracking-tight">{formatMoney(total)}</span>

                  </div>

                </div>



                <button type="submit" className="btn-base btn-primary w-full py-4">

                  Pay with M-Pesa

                </button>

                <button type="button" onClick={() => setStep("review")} className="press w-full py-2 text-center text-[12px] font-bold text-muted-foreground">

                  Back to bag

                </button>

              </form>

            </section>

          )}



          {step === "paying" && (

            <section className="mt-16 px-5 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">

                <Loader2 className="h-7 w-7 animate-spin text-primary" />

              </div>

              <h2 className="mt-5 text-[16px] font-black">Waiting for M-Pesa</h2>

              <p className="mx-auto mt-2 max-w-xs text-[13px] text-muted-foreground">

                {customerMessage ?? "Check your phone and enter your M-Pesa PIN to complete payment."}

              </p>

              <button onClick={() => setStep("address")} className="press mt-6 text-[12px] font-bold text-muted-foreground underline">

                Cancel and try again

              </button>

            </section>

          )}



          {step === "success" && (

            <section className="mt-16 px-5 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">

                <CheckCircle2 className="h-7 w-7 text-primary" />

              </div>

              <h2 className="mt-5 text-[16px] font-black">Payment confirmed</h2>

              <p className="mx-auto mt-2 max-w-xs text-[13px] text-muted-foreground">

                Your order is on its way to processing. We'll keep you updated on delivery.

              </p>

              <Link to="/orders" className="btn-base btn-primary mt-6 inline-flex px-8 py-3">

                View your orders

              </Link>

            </section>

          )}



          {step === "failed" && (

            <section className="mt-16 px-5 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">

                <XCircle className="h-7 w-7 text-destructive" />

              </div>

              <h2 className="mt-5 text-[16px] font-black">Payment didn't go through</h2>

              <p className="mx-auto mt-2 max-w-xs text-[13px] text-muted-foreground">

                {error ?? "Something went wrong. You can try again."}

              </p>

              <button onClick={() => setStep("address")} className="btn-base btn-primary mt-6 px-8 py-3">

                Try again

              </button>

              <button

                onClick={() => {

                  setOrderId(null);

                  setError(null);

                  setStep("review");

                }}

                className="press mt-3 block w-full text-center text-[12px] font-bold text-muted-foreground underline"

              >

                Cancel and return to bag

              </button>

            </section>

          )}

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



function Field({

  label,

  value,

  onChange,

  placeholder,

  type = "text",

}: {

  label: string;

  value: string;

  onChange: (v: string) => void;

  placeholder?: string;

  type?: string;

}) {

  return (

    <label className="block">

      <span className="mb-1.5 block text-[12px] font-bold text-muted-foreground">{label}</span>

      <input

        type={type}

        value={value}

        onChange={(e) => onChange(e.target.value)}

        placeholder={placeholder}

        className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"

      />

    </label>

  );

}