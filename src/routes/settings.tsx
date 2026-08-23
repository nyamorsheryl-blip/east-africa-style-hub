import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useAesthetic } from "@/components/ml/aesthetic-toggle";
import { TopBar } from "@/components/ml/top-bar";
import { BottomNav } from "@/components/ml/bottom-nav";
import { Check, Lock, Bell, Trash2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { mode, setAesthetic } = useAesthetic();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [pw, setPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  async function changePassword() {
    if (pw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated");
      setPw("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setPwSaving(false);
    }
  }

  async function toggleNotif(key: "order_updates" | "promotions") {
    if (!user || !profile) return;
    const next = { ...(profile.notification_prefs as Record<string, boolean>), [key]: !(profile.notification_prefs as Record<string, boolean>)[key] };
    const { error } = await supabase.from("profiles").update({ notification_prefs: next }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  const [confirmDelete, setConfirmDelete] = useState(false);
  async function requestDeletion() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deletion requested. Your account will be closed within 30 days.");
    await supabase.auth.signOut();
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <TopBar title="Settings" />
        <div className="mx-auto max-w-md px-5 pt-16 text-center">
          <div className="glass rounded-3xl p-8">
            <p className="text-sm text-muted-foreground">Sign in to manage your settings.</p>
            <Link to="/auth/login" className="btn-base btn-primary mt-4 inline-flex px-6 py-2.5">Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  const notif = (profile?.notification_prefs as Record<string, boolean>) ?? { order_updates: true, promotions: true };
  const deletionPending = !!profile?.deletion_requested_at;

  return (
    <div className="page-enter min-h-screen pb-32">
      <TopBar title="Settings" />
      <div className="mx-auto max-w-2xl px-5 pt-6 space-y-8">

        <section>
          <h2 className="mb-3 text-[15px] font-black tracking-tight">Appearance</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAesthetic("glass")}
              className={`glass relative rounded-3xl p-5 text-left ${mode === "glass" ? "ring-2 ring-primary" : ""}`}
            >
              {mode === "glass" && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
              <div className="font-bold">Glass</div>
              <div className="text-xs text-muted-foreground mt-1">Futuristic, chrome, Y2K-cyber-coquette</div>
            </button>
            <button
              onClick={() => setAesthetic("maximalist")}
              className={`relative rounded-3xl border-2 border-foreground p-5 text-left shadow-[4px_4px_0_var(--foreground)] ${mode === "maximalist" ? "ring-2 ring-primary" : ""}`}
            >
              {mode === "maximalist" && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
              <div className="font-bold">Maximalist</div>
              <div className="text-xs text-muted-foreground mt-1">Bold color, fine lines, poster energy</div>
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-black tracking-tight">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </h2>
          <div className="glass divide-y divide-border overflow-hidden rounded-3xl">
            {([
              { key: "order_updates" as const, label: "Order & delivery updates" },
              { key: "promotions" as const, label: "Promotions & offers" },
            ]).map(({ key, label }) => (
              <button key={key} onClick={() => toggleNotif(key)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                <span className="text-[13px] font-bold">{label}</span>
                <span className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${notif[key] ? "bg-primary justify-end" : "bg-muted justify-start"}`}>
                  <span className="h-5 w-5 rounded-full bg-white shadow" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-black tracking-tight">
            <Lock className="h-4 w-4 text-primary" /> Change password
          </h2>
          <div className="card-ml space-y-3 p-5">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button onClick={changePassword} disabled={pwSaving} className="btn-base btn-primary w-full py-3 disabled:opacity-60">
              {pwSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-black tracking-tight text-destructive">
            <AlertTriangle className="h-4 w-4" /> Danger zone
          </h2>
          <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-5">
            {deletionPending ? (
              <p className="text-sm font-semibold text-destructive">Deletion requested — your account will be closed soon.</p>
            ) : confirmDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">This will sign you out and permanently close your MaeLove account within 30 days. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="press glass flex-1 rounded-full py-3 text-sm font-bold">Cancel</button>
                  <button onClick={requestDeletion} className="press flex-1 rounded-full bg-destructive py-3 text-sm font-bold text-white">Yes, delete my account</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="press flex items-center gap-2 text-sm font-bold text-destructive">
                <Trash2 className="h-4 w-4" /> Delete account
              </button>
            )}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}