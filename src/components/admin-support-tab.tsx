import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Msg = { id: string; user_id: string; body: string; from_staff: boolean; created_at: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function SupportInboxTab({ adminId }: { adminId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    const { data, error } = await db.from("support_messages")
      .select("id, user_id, body, from_staff, created_at").order("created_at", { ascending: false }).limit(1000);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = (data ?? []) as Msg[];
    setMsgs(rows.slice().reverse());
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
      const next: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profs ?? []).forEach((p: any) => { next[p.id] = p.full_name ?? p.username ?? "Customer"; });
      setNames(next);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const ch = supabase.channel(`admin-support-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  const threads = useMemo(() => {
    const map = new Map<string, Msg>();
    msgs.forEach((m) => map.set(m.user_id, m));
    return Array.from(map.entries())
      .map(([userId, last]) => ({ userId, last }))
      .sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
  }, [msgs]);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !open) return;
    setSending(true);
    const { error } = await db.from("support_messages").insert({ user_id: open, sender_id: adminId, from_staff: true, body });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    void load();
  }

  if (loading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />;

  if (open) {
    const convo = msgs.filter((m) => m.user_id === open);
    return (
      <div className="mx-auto max-w-xl">
        <button onClick={() => setOpen(null)} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> All conversations
        </button>
        <h2 className="mb-3 text-lg font-black">{names[open] ?? "Customer"}</h2>
        <div className="glass max-h-[55vh] space-y-3 overflow-y-auto rounded-3xl p-4">
          {convo.map((m) => (
            <div key={m.id} className={`flex ${m.from_staff ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.from_staff ? "bg-primary text-primary-foreground" : "bg-white/80"}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={reply} className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Reply as MaeLove support"
            className="glass flex-1 rounded-full px-4 py-3 text-sm outline-none" />
          <button type="submit" disabled={sending || !text.trim()} aria-label="Send reply" className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-2">
      {threads.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No support messages yet.</p>}
      {threads.map(({ userId, last }) => (
        <button key={userId} onClick={() => setOpen(userId)} className="glass flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left">
          <div className="min-w-0">
            <div className="font-bold">{names[userId] ?? "Customer"}</div>
            <div className="truncate text-xs text-muted-foreground">{last.from_staff ? "You: " : ""}{last.body}</div>
          </div>
          {!last.from_staff && <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">Needs reply</span>}
        </button>
      ))}
    </div>
  );
}