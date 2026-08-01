import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Send, Paperclip, Mic, Image as ImageIcon, Check, CheckCheck, Search,
} from "lucide-react";
import { BottomNav } from "@/components/ml/bottom-nav";
import { IMAGES, DEMO_STORES } from "@/lib/demo-data";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — MaeLove" },
      { name: "description", content: "Chat directly with MaeLove boutiques: share photos, voice notes and files, and track order and delivery updates in one thread." },
      { property: "og:title", content: "Messages — MaeLove" },
      { property: "og:description", content: "Talk to sellers, share files and follow delivery updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Messages,
});

const THREADS = DEMO_STORES.map((s, i) => ({
  ...s,
  last: ["Your parcel is with the courier 🚚", "Yes, we can tailor to your size!", "Thanks for the order 💗", "New drop lands Friday"][i],
  time: ["2m", "1h", "Yesterday", "Mon"][i],
  unread: i === 0 ? 2 : 0,
}));

type Msg =
  | { id: number; from: "them" | "me"; kind: "text"; body: string; time: string; read?: boolean }
  | { id: number; from: "them" | "me"; kind: "image"; src: string; time: string }
  | { id: number; from: "them"; kind: "voice"; secs: number; time: string }
  | { id: number; from: "them"; kind: "product"; title: string; price: number; src: string; time: string }
  | { id: number; from: "them"; kind: "order"; code: string; status: string; time: string };

const SEED: Msg[] = [
  { id: 1, from: "them", kind: "text", body: "Hi Sarah! Thanks for shopping with us 💗", time: "09:12" },
  { id: 2, from: "them", kind: "product", title: "Noir Satin Blazer Dress", price: 18900, src: IMAGES.blazer, time: "09:12" },
  { id: 3, from: "me", kind: "text", body: "Love it. Does it run true to size?", time: "09:14", read: true },
  { id: 4, from: "them", kind: "voice", secs: 14, time: "09:15" },
  { id: 5, from: "them", kind: "image", src: IMAGES.women, time: "09:16" },
  { id: 6, from: "them", kind: "order", code: "MAE-48219", status: "Out for delivery · arrives today", time: "09:40" },
];

function Messages() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>(SEED);
  const [draft, setDraft] = useState("");
  const thread = THREADS.find((t) => t.slug === openId);

  function send() {
    if (!draft.trim()) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "me", kind: "text", body: draft.trim(), time: "now", read: false }]);
    setDraft("");
  }

  if (thread) {
    return (
      <div className="flex min-h-screen flex-col pb-32">
        <header className="glass-strong sticky top-0 z-40 flex items-center gap-3 px-4 py-4">
          <button onClick={() => setOpenId(null)} aria-label="Back to inbox" className="press flex h-10 w-10 items-center justify-center rounded-full bg-card/60">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={thread.image} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black">{thread.name}</div>
            <div className="text-[11px] text-primary">typing…</div>
          </div>
        </header>

        <div className="flex-1 space-y-3 px-5 py-6">
          {msgs.map((m) => {
            const mine = m.from === "me";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-3xl ${mine ? "bg-primary text-primary-foreground" : "glass"} ${m.kind === "image" ? "overflow-hidden p-1" : "px-4 py-3"}`}>
                  {m.kind === "text" && <p className="text-[13px] leading-relaxed">{m.body}</p>}
                  {m.kind === "image" && <img src={m.src} alt="Shared photo" className="h-44 w-56 rounded-[1.4rem] object-cover" />}
                  {m.kind === "voice" && (
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><Mic className="h-4 w-4" /></span>
                      <span className="flex h-6 items-end gap-[3px]">
                        {[6, 12, 18, 10, 20, 14, 8, 16, 11, 19, 7].map((h, i) => (
                          <span key={i} className="w-[3px] rounded-full bg-foreground/40" style={{ height: h }} />
                        ))}
                      </span>
                      <span className="text-[11px] font-bold">0:{m.secs}</span>
                    </div>
                  )}
                  {m.kind === "product" && (
                    <div className="flex items-center gap-3">
                      <img src={m.src} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                      <div>
                        <div className="text-[12px] font-black leading-tight">{m.title}</div>
                        <div className="mt-1 text-[13px] font-black text-primary">{formatMoney(m.price)}</div>
                      </div>
                    </div>
                  )}
                  {m.kind === "order" && (
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Order {m.code}</div>
                      <div className="mt-1 text-[13px] font-bold">{m.status}</div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-3/4 rounded-full bg-primary" />
                      </div>
                    </div>
                  )}
                  <div className={`mt-1.5 flex items-center gap-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {m.time}
                    {mine && ("read" in m && m.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-start">
            <div className="glass flex items-center gap-1 rounded-full px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5 pt-3" style={{ background: "linear-gradient(0deg, var(--background) 60%, transparent)" }}>
          <div className="glass-strong flex items-center gap-2 rounded-full px-3 py-2">
            <button aria-label="Attach file" className="press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"><Paperclip className="h-4 w-4" /></button>
            <button aria-label="Send photo" className="press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"><ImageIcon className="h-4 w-4" /></button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message…"
              aria-label="Message"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={send} aria-label="Send" className="press flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="px-5 pb-4 pt-8">
        <h1 className="text-[34px] font-black leading-none tracking-tight">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chat with boutiques, follow orders and deliveries.</p>
        <div className="glass mt-5 flex items-center gap-2.5 rounded-full px-4 py-3">
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input placeholder="Search conversations" aria-label="Search conversations" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
      </header>

      <div className="space-y-3 px-5">
        {THREADS.map((t) => (
          <button key={t.slug} onClick={() => setOpenId(t.slug)} className="press glass flex w-full items-center gap-4 rounded-3xl p-3 text-left">
            <img src={t.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-black">{t.name}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{t.time}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-[12px] text-muted-foreground">{t.last}</span>
                {t.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground">{t.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 px-5">
        <Link to="/explore" className="press glass-blush flex items-center justify-between rounded-3xl px-5 py-4 text-sm font-extrabold">
          Discover new boutiques <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
