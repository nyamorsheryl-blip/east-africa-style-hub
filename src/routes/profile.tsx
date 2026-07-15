import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { formatMoney } from "@/lib/format";
import { Sparkle, LogOut, Store } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  const { data: orders } = useQuery({
    queryKey: ["profile-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_cents, currency, created_at, order_items(title)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading) return <div className="min-h-screen pb-28" />;

  if (!user) {
    return (
      <div className="min-h-screen pb-28 px-5 pt-16">
        <div className="glass rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-black text-plum">Welcome to MaeLove</h1>
          <p className="mt-2 text-sm text-plum/70">Sign in to see your profile, orders and points.</p>
          <Link to="/auth" className="mt-6 inline-flex rounded-full bg-berry px-6 py-3 text-sm font-extrabold text-white">
            Sign in
          </Link>
        </div>
        <MobileTabBar />
      </div>
    );
  }

  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Member";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-8 flex items-center gap-4">
        <div className="relative">
          <div className="h-24 w-24 rounded-full ring-4 ring-white bg-gradient-to-br from-blush to-berry flex items-center justify-center text-white text-2xl font-black">
            {initials}
          </div>
          <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-lime ring-2 ring-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-plum truncate">{name}</h1>
          <p className="text-sm text-plum/60 truncate">{user.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-berry/15 px-3 py-1 text-[10px] font-extrabold text-berry tracking-widest">
            GOLD MEMBER <Sparkle className="h-3 w-3 fill-berry" />
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 mt-6 glass rounded-3xl grid grid-cols-3 divide-x divide-plum/10 py-5">
        {[
          { n: orders?.length ?? 0, l: "Orders" },
          { n: 8, l: "Saved" },
          { n: "1,420", l: "Points" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl font-black text-berry">{s.n}</div>
            <div className="text-xs font-semibold text-plum/60">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="px-5 mt-8">
        <h2 className="text-xl font-black text-plum mb-4">Recent Orders</h2>
        {!orders || orders.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-plum/60">
            No orders yet.{" "}
            <Link to="/shop" search={{}} className="text-berry font-extrabold">Start shopping →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="glass rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-plum">#ML-{o.id.slice(0, 4).toUpperCase()}</div>
                  <div className="text-sm font-semibold text-plum truncate">
                    {(o.order_items as { title: string }[])?.[0]?.title ?? "Order"}
                  </div>
                  <div className="text-xs text-plum/50 mt-1">
                    {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-berry capitalize">{o.status}</div>
                  <div className="mt-1 text-lg font-black text-plum">
                    {formatMoney(o.total_cents, o.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 mt-6 space-y-2">
        <Link to="/seller" className="glass rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-extrabold text-plum">
          <Store className="h-4 w-4 text-berry" /> Seller dashboard
        </Link>
        <button onClick={signOut} className="w-full glass rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-extrabold text-plum">
          <LogOut className="h-4 w-4 text-berry" /> Sign out
        </button>
      </div>

      <MobileTabBar />
    </div>
  );
}
