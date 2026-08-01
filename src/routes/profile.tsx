import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Package, Heart, Wallet, MessageCircle, Settings, MapPin, Trophy,
  Store, Truck, ChevronRight, LogOut, Pencil, ShieldCheck, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Section } from "@/components/ml/section";
import { Skeleton } from "@/components/ml/states";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — MaeLove" },
      { name: "description", content: "Manage your MaeLove orders, wishlist, wallet, addresses, achievements and seller tools in one place." },
      { property: "og:title", content: "Your Profile — MaeLove" },
      { property: "og:description", content: "Orders, wishlist, wallet, addresses and seller tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

const LINKS = [
  { label: "Orders", icon: Package, to: "/orders" },
  { label: "Wishlist", icon: Heart, to: "/wishlist" },
  { label: "Messages", icon: MessageCircle, to: "/messages" },
  { label: "Seller Dashboard", icon: Store, to: "/sell" },
] as const;

const ROWS = [
  { label: "Wallet & payments", icon: Wallet, hint: "$0.00 balance" },
  { label: "Addresses", icon: MapPin, hint: "2 saved" },
  { label: "Achievements", icon: Trophy, hint: "3 badges" },
  { label: "Become a delivery partner", icon: Truck, hint: "Coming soon" },
  { label: "Settings", icon: Settings, hint: "" },
] as const;

function Profile() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", country: "" });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function save() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  const name = (profile?.full_name as string) || user?.email?.split("@")[0] || "Guest";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen pb-32">
      <header className="rise px-5 pt-8">
        <div className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-hero)" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/25 text-2xl font-black backdrop-blur-md">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              {isLoading && user ? (
                <Skeleton className="h-6 w-36 bg-white/30" />
              ) : (
                <div className="truncate text-2xl font-black tracking-tight">{name}</div>
              )}
              <div className="truncate text-[12px] text-white/85">
                {user ? `@${(profile?.username as string) ?? "maelove"}` : "Sign in to unlock your MaeLove"}
              </div>
            </div>
            {user && (
              <button onClick={() => { setForm({ full_name: (profile?.full_name as string) ?? "", username: (profile?.username as string) ?? "", country: (profile?.country as string) ?? "" }); setEditing((e) => !e); }} aria-label="Edit profile" className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-md">
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[["Orders", "12"], ["Saved", "38"], ["Points", "1,240"]].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-white/20 py-3 backdrop-blur-md">
                <div className="text-lg font-black">{v}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/85">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {!user && (
        <div className="mt-5 px-5">
          <Link to="/auth" className="press glass-cherry flex items-center justify-between rounded-3xl px-6 py-4 text-sm font-extrabold">
            Sign in or create an account <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {editing && (
        <div className="rise mt-5 px-5">
          <div className="glass space-y-3 rounded-3xl p-5">
            {(["full_name", "username", "country"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={k} className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                  {k.replace("_", " ")}
                </label>
                <input
                  id={k}
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl bg-card px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(false)} className="press glass flex-1 rounded-full py-3 text-sm font-bold">Cancel</button>
              <button onClick={save} className="press glass-cherry flex-1 rounded-full py-3 text-sm font-extrabold">Save</button>
            </div>
          </div>
        </div>
      )}

      <Section title="Quick access">
        <div className="grid grid-cols-2 gap-3 px-5">
          {LINKS.map(({ label, icon: Icon, to }) => (
            <Link key={label} to={to} className="press glass flex items-center gap-3 rounded-3xl p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full glass-blush"><Icon className="h-4 w-4" /></span>
              <span className="text-[13px] font-bold leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Your account">
        <div className="glass mx-5 divide-y divide-border overflow-hidden rounded-3xl">
          {ROWS.map(({ label, icon: Icon, hint }) => (
            <button key={label} className="press flex w-full items-center gap-3 px-5 py-4 text-left">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-[13px] font-bold">{label}</span>
              {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Achievements" subtitle="Earn badges as you shop and sell">
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5">
          {[
            { icon: ShieldCheck, label: "Verified buyer" },
            { icon: Star, label: "Top reviewer" },
            { icon: Trophy, label: "Early adopter" },
            { icon: Heart, label: "Trendsetter" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="glass flex w-[124px] shrink-0 flex-col items-center gap-2 rounded-3xl p-4 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full glass-blush"><Icon className="h-5 w-5" /></span>
              <span className="text-[11px] font-bold leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {user && (
        <div className="mt-12 px-5">
          <button
            onClick={async () => { await supabase.auth.signOut(); toast.success("Signed out"); }}
            className="press glass flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-primary"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
