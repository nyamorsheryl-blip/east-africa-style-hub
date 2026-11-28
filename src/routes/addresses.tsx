import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/addresses")({
  head: () => ({ meta: [{ title: "My addresses - MaeLove" }] }),
  component: AddressesPage,
});

type Address = {
  id: string; label: string; full_name: string; phone: string; line1: string;
  city: string; county: string | null; notes: string | null; is_default: boolean;
};
const EMPTY = { label: "Home", full_name: "", phone: "", line1: "", city: "", county: "", notes: "", is_default: false };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function AddressesPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [list, setList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // address id, "new", or null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load(uid: string) {
    const { data, error } = await db.from("addresses").select("*").eq("user_id", uid)
      .order("is_default", { ascending: false }).order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setList((data ?? []) as Address[]);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate({ to: "/auth/login" }); return; }
      setUserId(data.user.id);
      void load(data.user.id);
    });
  }, [navigate]);

  function startNew() { setForm(EMPTY); setEditing("new"); }
  function startEdit(a: Address) {
    setForm({ label: a.label, full_name: a.full_name, phone: a.phone, line1: a.line1, city: a.city, county: a.county ?? "", notes: a.notes ?? "", is_default: a.is_default });
    setEditing(a.id);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !editing) return;
    if (!form.full_name.trim() || !form.line1.trim() || !form.city.trim()) {
      toast.error("Please fill in your name, address and town");
      return;
    }
    if (!/^(?:\+?254|0)?[17]\d{8}$/.test(form.phone.replace(/[\s-]/g, ""))) {
      toast.error("Enter a valid Kenyan phone number, like 0712 345 678");
      return;
    }
    setSaving(true);
    const row = {
      label: form.label.trim() || "Home",
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      city: form.city.trim(),
      county: form.county.trim() || null,
      notes: form.notes.trim() || null,
      is_default: form.is_default || list.length === 0,
    };
    const { error } = editing === "new"
      ? await db.from("addresses").insert({ ...row, user_id: userId })
      : await db.from("addresses").update({ ...row, updated_at: new Date().toISOString() }).eq("id", editing);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Address saved");
    setEditing(null);
    await load(userId);
  }

  async function remove(id: string) {
    if (!userId || !window.confirm("Delete this address?")) return;
    const { error } = await db.from("addresses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await load(userId);
  }

  async function makeDefault(id: string) {
    if (!userId) return;
    const { error } = await db.from("addresses").update({ is_default: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await load(userId);
  }

  const field = (label: string, key: keyof typeof EMPTY, placeholder: string, type = "text") => (
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-plum/70">
      {label}
      <input
        type={type} value={form[key] as string} placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-1.5 w-full rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-berry"
      />
    </label>
  );

  return (
    <div className="min-h-screen px-5 pt-8 pb-24">
      <div className="mx-auto max-w-md">
        <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-plum">
          <ArrowLeft className="h-3 w-3" /> Back to profile
        </Link>
        <h1 className="mt-3 font-display text-2xl font-black">My addresses</h1>
        <p className="text-sm text-muted-foreground">Save where you like your orders delivered.</p>

        {loading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-berry" />}

        {!loading && !editing && (
          <div className="mt-5 space-y-3">
            {list.length === 0 && (
              <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
                <MapPin className="mx-auto mb-2 h-6 w-6 text-berry" />
                No saved addresses yet.
              </div>
            )}
            {list.map((a) => (
              <div key={a.id} className="glass rounded-3xl p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-black">{a.label}</span>
                  {a.is_default
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-berry/10 px-2.5 py-1 text-[10px] font-bold uppercase text-berry"><Star className="h-3 w-3" /> Default</span>
                    : <button onClick={() => makeDefault(a.id)} className="text-[11px] font-semibold text-berry underline">Make default</button>}
                </div>
                <p className="mt-1 text-sm">{a.full_name} - {a.phone}</p>
                <p className="text-sm text-muted-foreground">{a.line1}, {a.city}{a.county ? `, ${a.county}` : ""}</p>
                {a.notes && <p className="mt-1 text-xs text-muted-foreground">Note: {a.notes}</p>}
                <div className="mt-3 flex gap-4 text-xs font-semibold">
                  <button onClick={() => startEdit(a)} className="inline-flex items-center gap-1 text-plum"><Pencil className="h-3 w-3" /> Edit</button>
                  <button onClick={() => remove(a.id)} className="inline-flex items-center gap-1 text-destructive"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
            ))}
            <button onClick={startNew} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-berry py-3.5 text-sm font-semibold text-cream shadow-[var(--shadow-glow)]">
              <Plus className="h-4 w-4" /> Add an address
            </button>
          </div>
        )}

        {editing && (
          <form onSubmit={save} className="glass mt-5 space-y-3.5 rounded-3xl p-5">
            {field("Label", "label", "Home, Work...")}
            {field("Full name", "full_name", "Amara Okoye")}
            {field("Phone", "phone", "07XX XXX XXX", "tel")}
            {field("Address", "line1", "Street, building, apartment")}
            {field("City / Town", "city", "Nairobi")}
            {field("County (optional)", "county", "Nairobi County")}
            {field("Delivery notes (optional)", "notes", "Gate code, landmark...")}
            <label className="flex items-center gap-2 text-xs text-plum/80">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} className="h-4 w-4 rounded border-berry/40 text-berry" />
              Use as my default address
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-full glass py-3.5 text-sm font-semibold text-plum">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-berry py-3.5 text-sm font-semibold text-cream disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}