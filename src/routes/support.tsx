import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support chat - MaeLove" }] }),
  component: SupportPage,
});

type Msg = { id: string; body: string; from_staff: boolean; created_at: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function SupportPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }
      const { data: rows, error } = await db.from("support_messages")
        .select("id, body, from_staff, created_at").eq("user_id", uid).order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) toast.error(error.message); else setMsgs((rows ?? []) as Msg[]);
      setLoading(false);
      channel = supabase.channel(`support-${uid}-${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${uid}` },
          (payload) => {
            const m = payload.new as Msg;
            setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          })
        .subscribe();
    });
    return () => { cancelled = true; if (channel) void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !userId) return;
    setSending(true);
    const { data, error } = await db.from("support_messages")
      .insert({ user_id: userId, sender_id: userId, from_staff: false, body })
      .select("id, body, from_staff, created_at").single();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    const m = data as Msg;
    setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

  return (
    <div className="min-h-screen px-5 pt-8 pb-10">
      <div className="mx-auto flex max-w-md flex-col">
        <Link to="/help" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-plum">
          <ArrowLeft className="h-3 w-3" /> Help and FAQs
        </Link>
        <h1 className="mt-3 font-display text-2xl font-black">Chat with support</h1>
        <p className="text-sm text-muted-foreground">We usually reply within 2 business days. You will see replies here.</p>

        {loading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-berry" />}

        {!loading && !userId && (
          <div className="glass mt-6 rounded-3xl p-6 text-center text-sm">
            <p>Please sign in to chat with us.</p>
            <Link to="/auth/login" className="mt-4 inline-flex rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-cream">Sign in</Link>
            <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> Or email officialmaelove@gmail.com
            </p>
          </div>
        )}

        {!loading && userId && (
          <>
            <div className="glass mt-5 min-h-[50vh] space-y-3 rounded-3xl p-4">
              {msgs.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">Say hello. Tell us what you need help with and include your order number if you have one.</p>
              )}
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.from_staff ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.from_staff ? "bg-white/80 text-plum" : "bg-berry text-cream"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${m.from_staff ? "text-muted-foreground" : "text-cream/70"}`}>
                      {m.from_staff ? "MaeLove support - " : ""}{new Date(m.created_at).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input
                value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Type your message"
                className="flex-1 rounded-full border border-white/80 bg-white/70 px-4 py-3 text-sm outline-none focus:border-berry"
              />
              <button type="submit" disabled={sending || !text.trim()} aria-label="Send" className="grid h-12 w-12 place-items-center rounded-full bg-berry text-cream disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}