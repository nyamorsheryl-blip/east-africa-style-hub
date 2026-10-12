import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Send, Paperclip, Mic, Square, Check, CheckCheck, Search, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatMoney } from "@/lib/format";
import { BottomNav } from "@/components/ml/bottom-nav";
import { EmptyState } from "@/components/ml/states";

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

type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  boutique_id: string | null;
  last_message_at: string;
  boutiques: { name: string | null; logo_url: string | null } | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: "text" | "image" | "voice" | "product" | "order";
  body: string | null;
  image_url: string | null;
  voice_url: string | null;
  voice_seconds: number | null;
  product_id: string | null;
  order_id: string | null;
  created_at: string;
  product: { title: string | null; price_cents: number | null; sale_price_cents: number | null; images: string[] | null } | null;
  order: { status: string | null; created_at: string | null } | null;
};

function Messages() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);
  const [counterparts, setCounterparts] = useState<Record<string, { name: string; avatar: string | null }>>({});

  // "Ask the seller" on the product page drops the target conversation id
  // here before navigating, so it opens directly on arrival.
  useEffect(() => {
    const pending = sessionStorage.getItem("ml_open_conversation");
    if (pending) {
      setOpenId(pending);
      sessionStorage.removeItem("ml_open_conversation");
    }
  }, []);

  const { data: conversations } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, boutique_id, last_message_at, boutiques(name, logo_url)")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ConversationRow[];
    },
  });

  // For threads where the current user is the seller, the "other side" is a
  // buyer, not a boutique — fetch those profiles separately since there's no
  // direct FK path for PostgREST to embed them automatically.
  useEffect(() => {
    if (!conversations || !user) return;
    const buyerIdsNeeded = conversations
      .filter((c) => c.seller_id === user.id)
      .map((c) => c.buyer_id);
    if (buyerIdsNeeded.length === 0) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", buyerIdsNeeded);
      if (!data) return;
      setCounterparts((prev) => {
        const next = { ...prev };
        for (const p of data) next[p.id] = { name: p.full_name ?? "Buyer", avatar: p.avatar_url };
        return next;
      });
    })();
  }, [conversations, user]);

  function counterpartFor(c: ConversationRow) {
    if (!user) return { name: "", avatar: null as string | null };
    if (c.seller_id === user.id) {
      return counterparts[c.buyer_id] ?? { name: "Buyer", avatar: null };
    }
    return { name: c.boutiques?.name ?? "Boutique", avatar: c.boutiques?.logo_url ?? null };
  }

  if (loading) return <div className="min-h-screen pb-32" />;

  if (!user) {
    return (
      <div className="min-h-screen pb-32">
        <div className="mt-10">
          <EmptyState
            icon={<MessageCircle className="h-5 w-5" />}
            title="Sign in to message sellers"
            copy="Chat with boutiques, follow orders and deliveries."
            action={<Link to="/auth/login" className="btn-base btn-primary">Sign in</Link>}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  const thread = conversations?.find((c) => c.id === openId);

  if (thread) {
    return <ThreadView conversation={thread} currentUserId={user.id} counterpart={counterpartFor(thread)} onBack={() => setOpenId(null)} />;
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

      {!conversations || conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<MessageCircle className="h-5 w-5" />}
            title="No conversations yet"
            copy="Message a boutique from any product page to start chatting."
            action={<Link to="/explore" className="btn-base btn-primary">Browse products</Link>}
          />
        </div>
      ) : (
        <div className="space-y-3 px-5">
          {conversations.map((c) => {
            const cp = counterpartFor(c);
            return (
              <button key={c.id} onClick={() => setOpenId(c.id)} className="press glass flex w-full items-center gap-4 rounded-3xl p-3 text-left">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {cp.avatar && <img src={cp.avatar} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black">{cp.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <LastMessagePreview conversationId={c.id} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 px-5">
        <Link to="/explore" className="press glass-blush flex items-center justify-between rounded-3xl px-5 py-4 text-sm font-extrabold">
          Discover new boutiques <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}

function LastMessagePreview({ conversationId }: { conversationId: string }) {
  const { data } = useQuery({
    queryKey: ["last-message", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("kind, body")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { kind: string; body: string | null } | null;
    },
  });
  const label = !data
    ? "Say hello"
    : data.kind === "text"
    ? data.body ?? ""
    : data.kind === "image"
    ? "📷 Photo"
    : data.kind === "voice"
    ? "🎤 Voice note"
    : data.kind === "product"
    ? "Shared a product"
    : "Order update";
  return <div className="mt-1 truncate text-[12px] text-muted-foreground">{label}</div>;
}

function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 3600);
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);
  return url;
}

function ThreadView({
  conversation,
  currentUserId,
  counterpart,
  onBack,
}: {
  conversation: ConversationRow;
  currentUserId: string;
  counterpart: { name: string; avatar: string | null };
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["messages", conversation.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, product:products(title, price_cents, sale_price_cents, images), order:orders(status, created_at)")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as MessageRow[];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversation.id, queryClient]);

  async function sendText() {
    if (!draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      kind: "text",
      body,
    });
    if (error) toast.error(error.message);
  }

  async function sendImage(file: File) {
    const path = `${conversation.id}/img-${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (uploadErr) {
      toast.error(uploadErr.message);
      return;
    }
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      kind: "image",
      image_url: path,
    });
    if (error) toast.error(error.message);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const seconds = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const path = `${conversation.id}/voice-${Date.now()}.webm`;
        const { error: uploadErr } = await supabase.storage.from("chat-attachments").upload(path, blob);
        stream.getTracks().forEach((t) => t.stop());
        if (uploadErr) {
          toast.error(uploadErr.message);
          return;
        }
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          kind: "voice",
          voice_url: path,
          voice_seconds: seconds,
        });
        if (error) toast.error(error.message);
      };
      mediaRecorderRef.current = recorder;
      recordStartRef.current = Date.now();
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Couldn't access your microphone");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="flex min-h-screen flex-col pb-32">
      <header className="glass-strong sticky top-0 z-40 flex items-center gap-3 px-4 py-4">
        <button onClick={onBack} aria-label="Back to inbox" className="press flex h-10 w-10 items-center justify-center rounded-full bg-card/60">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
          {counterpart.avatar && <img src={counterpart.avatar} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black">{counterpart.name}</div>
        </div>
      </header>

      <div className="flex-1 space-y-3 px-5 py-6">
        {(messages ?? []).map((m) => (
          <MessageBubble key={m.id} m={m} mine={m.sender_id === currentUserId} />
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5 pt-3" style={{ background: "linear-gradient(0deg, var(--background) 60%, transparent)" }}>
        <div className="glass-strong flex items-center gap-2 rounded-full px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void sendImage(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Send photo"
            className="press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendText()}
            placeholder={recording ? "Recording…" : "Message…"}
            aria-label="Message"
            disabled={recording}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {draft.trim() ? (
            <button onClick={sendText} aria-label="Send" className="press flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? "Stop recording" : "Record voice note"}
              className={`press flex h-10 w-10 items-center justify-center rounded-full ${recording ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, mine }: { m: MessageRow; mine: boolean }) {
  const imageUrl = useSignedUrl(m.kind === "image" ? m.image_url : null);
  const voiceUrl = useSignedUrl(m.kind === "voice" ? m.voice_url : null);
  const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const productImage = m.product?.images?.[0];
  const productPrice = m.product?.sale_price_cents ?? m.product?.price_cents ?? 0;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-3xl ${mine ? "bg-primary text-primary-foreground" : "glass"} ${m.kind === "image" ? "overflow-hidden p-1" : "px-4 py-3"}`}>
        {m.kind === "text" && <p className="text-[13px] leading-relaxed">{m.body}</p>}

        {m.kind === "image" && (imageUrl ? <img src={imageUrl} alt="Shared photo" className="h-44 w-56 rounded-[1.4rem] object-cover" /> : <div className="h-44 w-56 animate-pulse rounded-[1.4rem] bg-muted" />)}

        {m.kind === "voice" && (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 shrink-0" />
            {voiceUrl ? <audio src={voiceUrl} controls className="h-8 max-w-[180px]" /> : <span className="text-[11px]">Loading…</span>}
            {m.voice_seconds != null && <span className="shrink-0 text-[11px] font-bold">0:{String(m.voice_seconds).padStart(2, "0")}</span>}
          </div>
        )}

        {m.kind === "product" && m.product && (
          <div className="flex items-center gap-3">
            {productImage && <img src={productImage} alt="" className="h-14 w-14 rounded-2xl object-cover" />}
            <div>
              <div className="text-[12px] font-black leading-tight">{m.product.title}</div>
              <div className="mt-1 text-[13px] font-black text-primary">{formatMoney(productPrice)}</div>
            </div>
          </div>
        )}

        {m.kind === "order" && m.order && (
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              Order #{m.order_id?.slice(0, 8)}
            </div>
            <div className="mt-1 text-[13px] font-bold capitalize">{m.order.status}</div>
          </div>
        )}

        <div className={`mt-1.5 flex items-center gap-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {time}
          {mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  );
}
