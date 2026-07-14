import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { Heart, ShoppingBag, MapPin, Truck, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/product/$id")({ component: ProductPage });

function ProductPage() {
  const { id } = Route.useParams();
  const cart = useCart();
  const { user } = useSession();
  const [selectedImg, setSelectedImg] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, boutiques(name, slug, city, country, verified)").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  async function addWishlist() {
    if (!user) { toast.error("Sign in to save favourites"); return; }
    const { error } = await supabase.from("wishlist").insert({ user_id: user.id, product_id: id });
    if (error && !error.message.includes("duplicate")) toast.error(error.message);
    else toast.success("Saved to wishlist");
  }

  if (isLoading || !data) {
    return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-7xl px-4 py-12"><div className="glass rounded-3xl h-96 animate-pulse" /></div></div>;
  }

  const price = data.sale_price_cents ?? data.price_cents;
  const boutique = data.boutiques as { name: string; slug: string; city: string | null; country: string; verified: boolean } | null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8">
        <div className="text-sm text-muted-foreground mb-4"><Link to="/shop" className="hover:text-primary">Shop</Link> / {data.category}</div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="glass rounded-3xl p-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              {data.images?.[selectedImg] ? (
                <img src={data.images[selectedImg]} alt={data.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ background: "var(--gradient-hero)" }} />
              )}
            </div>
            {data.images && data.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {data.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImg(i)} className={`h-16 w-16 rounded-xl overflow-hidden shrink-0 border-2 ${selectedImg === i ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="glass rounded-3xl p-6 md:p-8">
              {boutique && (
                <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground">{boutique.name}</span>
                  {boutique.verified && <Sparkles className="h-3 w-3 text-primary" />}
                  <span>· <MapPin className="inline h-3 w-3" /> {boutique.city ?? boutique.country}</span>
                </Link>
              )}
              <h1 className="font-display text-3xl md:text-4xl font-semibold">{data.title}</h1>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-3xl text-primary font-bold">{formatMoney(price, data.currency)}</span>
                {data.sale_price_cents && <span className="line-through text-muted-foreground">{formatMoney(data.price_cents, data.currency)}</span>}
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{data.description}</p>

              {data.sizes?.length > 0 && (
                <div className="mt-6">
                  <div className="text-xs font-semibold mb-2">SIZES</div>
                  <div className="flex flex-wrap gap-2">
                    {data.sizes.map((s: string) => <span key={s} className="rounded-full glass px-3 py-1 text-xs">{s}</span>)}
                  </div>
                </div>
              )}
              {data.colors?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold mb-2">COLOURS</div>
                  <div className="flex flex-wrap gap-2">
                    {data.colors.map((c: string) => <span key={c} className="rounded-full glass px-3 py-1 text-xs">{c}</span>)}
                  </div>
                </div>
              )}
              {data.materials && <div className="mt-4 text-xs text-muted-foreground"><b className="text-foreground">Materials:</b> {data.materials}</div>}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    cart.add({ productId: data.id, title: data.title, priceCents: price, imageUrl: data.images?.[0], sellerId: data.owner_id });
                    toast.success("Added to cart");
                  }}
                  disabled={data.stock <= 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50">
                  <ShoppingBag className="h-4 w-4" /> {data.stock > 0 ? "Add to cart" : "Sold out"}
                </button>
                <button onClick={addWishlist} className="glass rounded-full p-3.5" aria-label="Save to wishlist"><Heart className="h-4 w-4" /></button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <div className="glass rounded-2xl p-3"><Truck className="h-4 w-4 mb-1 text-primary" /><b>Ships worldwide</b><div className="text-muted-foreground">5–14 days delivery</div></div>
                <div className="glass rounded-2xl p-3"><Sparkles className="h-4 w-4 mb-1 text-primary" /><b>Verified boutique</b><div className="text-muted-foreground">Vetted by MaeLove</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
