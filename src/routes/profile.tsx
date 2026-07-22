import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Sparkles, LogOut, Pencil, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", country: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, country, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        username: profile.username ?? "",
        country: profile.country ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim() || null,
        username: form.username.trim() || null,
        country: form.country.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditing(false);
    refetch();
  }

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
          <p className="mt-2 text-sm text-plum/70">Sign in to see your profile and orders.</p>
          <Link to="/auth" className="mt-6 inline-flex rounded-full bg-berry px-6 py-3 text-sm font-extrabold text-white">
            Sign in
          </Link>
        </div>
        <MobileTabBar />
      </div>
    );
  }

  const name = profile?.full_name || user.email?.split("@")[0] || "Member";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-28">
      <div className="px-5 pt-8 flex items-center gap-4">
        <div className="relative">
          <div className="h-24 w-24 rounded-full ring-4 ring-white bg-gradient-to-br from-blush to-berry flex items-center justify-center text-white text-2xl font-black overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : initials}
          </div>
          <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-lime ring-2 ring-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-plum truncate">{name}</h1>
          {profile?.username && <p className="text-sm text-plum/60 truncate">@{profile.username}</p>}
          <p className="text-xs text-plum/50 truncate">{user.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-berry/15 px-3 py-1 text-[10px] font-extrabold text-berry tracking-widest">
            MAELOVE MEMBER <Sparkles className="h-3 w-3" />
          </span>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="glass rounded-full h-10 w-10 flex items-center justify-center text-plum"
          aria-label="Edit profile"
        >
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
      </div>

      {editing && (
        <div className="mx-5 mt-6 glass rounded-3xl p-5 space-y-3">
          <Field label="Full name">
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full bg-transparent outline-none text-sm font-semibold text-plum" placeholder="Your name" />
          </Field>
          <Field label="Username">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} className="w-full bg-transparent outline-none text-sm font-semibold text-plum" placeholder="username" />
          </Field>
          <Field label="Country">
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full bg-transparent outline-none text-sm font-semibold text-plum" placeholder="Kenya" />
          </Field>
          <Field label="Avatar URL">
            <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} className="w-full bg-transparent outline-none text-sm font-semibold text-plum" placeholder="https://…" />
          </Field>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}

      <div className="px-5 mt-6 space-y-2">
        <Link to="/orders" className="glass rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-extrabold text-plum">
          My orders
        </Link>
        <Link to="/wishlist" className="glass rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-extrabold text-plum">
          Saved items
        </Link>
        <button onClick={signOut} className="w-full glass rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-extrabold text-plum">
          <LogOut className="h-4 w-4 text-berry" /> Sign out
        </button>
      </div>

      <MobileTabBar />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-2xl bg-white/60 px-4 py-2.5 border border-white">
      <div className="text-[10px] font-extrabold tracking-widest text-plum/60 uppercase">{label}</div>
      {children}
    </label>
  );
}
