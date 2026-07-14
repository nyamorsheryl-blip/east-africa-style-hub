import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { useSession } from "@/hooks/use-session";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { Heart, Trash2 } from "lucide-react";

export const Route = createFileRoute("/wishlist")({ component: Wishlist });

function Wishlist() {
  const { user, loading } = useSession();
  const { data, refetch } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist").select("product_id, products(id,title,price_cents,sale_price_cents,currency,images,category)").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  async function remove(pid: string) {
    if (!user) return;
    await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", pid);
    toast.success("Removed");
    refetch();
  }

  if (loading) return <div className="min-h-screen"><SiteHeader /></div>;
  if (!user) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="glass rounded-3xl p-8">
          <Heart className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-display text-xl">Sign in to save favourites</p>
          <Link to="/auth" className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-10">
        <h1 className="font-display text-4xl font-semibold mb-6">Your wishlist</h1>
        {!data || data.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">No favourites yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.map((row) => {
              const p = row.products as { id: string; title: string; price_cents: number; sale_price_cents: number | null; currency: string; images: string[]; category: string } | null;
              if (!p) return null;
              return (
                <div key={p.id} className="glass rounded-2xl overflow-hidden relative">
                  <Link to="/product/$id" params={{ id: p.id }}>
                    <div className="aspect-[3/4] bg-muted overflow-hidden">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: "var(--gradient-warm)" }} />}
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-muted-foreground">{p.category}</div>
                      <div className="text-sm font-semibold truncate">{p.title}</div>
                      <div className="text-sm font-bold text-primary">{formatMoney(p.sale_price_cents ?? p.price_cents, p.currency)}</div>
                    </div>
                  </Link>
                  <button onClick={() => remove(p.id)} className="absolute top-2 right-2 glass rounded-full p-2"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
