import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STATUS_META: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "glass text-muted-foreground" },
  processing: { label: "Processing", icon: Loader2, className: "glass text-muted-foreground" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-primary/10 text-primary" },
  failed: { label: "Failed", icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

// Accepts 0712345678, +254712345678, 254712345678, 712345678 -> 254712345678
function normalizePhone(raw: string) {
  const d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("254")) return d;
  if (d.startsWith("0")) return "254" + d.slice(1);
  if (d.length === 9) return "254" + d;
  return d;
}

export function PayoutsTab() {
  const qc = useQueryClient();
  const [boutiqueId, setBoutiqueId] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const { data: boutiques } = useQuery({
    queryKey: ["admin-payout-boutiques"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boutiques")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*, boutiques(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  async function send() {
    const normalized = normalizePhone(phone);
    const kes = Math.round(Number(amount));

    if (!/^254[17]\d{8}$/.test(normalized)) {
      toast.error("Enter a valid Kenyan number, e.g. 0712345678");
      return;
    }
    if (!Number.isFinite(kes) || kes < 1 || kes > 150000) {
      toast.error("Amount must be between 1 and 150,000 KES");
      return;
    }
    if (!window.confirm(`Send ${formatKes(kes)} to ${normalized}?`)) return;

    setSending(true);
    const { error } = await supabase.functions.invoke("swift-service", {
      body: {
        phone: normalized,
        amount_kes: kes,
        boutique_id: boutiqueId || null,
        reason: reason.trim() || null,
      },
    });
    setSending(false);

    if (error) {
      let msg = error.message;
      try {
        const b = await (error as any).context.json();
        msg = b.error ?? b.errorMessage ?? b.ResponseDescription ?? msg;
      } catch {
        // keep the generic message
      }
      toast.error(msg);
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      return;
    }

    toast.success("Payout sent to Safaricom. Status will update shortly.");
    setPhone("");
    setAmount("");
    setReason("");
    qc.invalidateQueries({ queryKey: ["admin-payouts"] });
  }

  return (
    <div className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold">Send a payout</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">
          M-Pesa B2C (sandbox). Use test number 254708374149 while testing.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={boutiqueId}
            onChange={(e) => setBoutiqueId(e.target.value)}
            className="glass w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
          >
            <option value="">No boutique (general payout)</option>
            {(boutiques ?? []).map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone, e.g. 0712345678"
            inputMode="tel"
            className="glass w-full rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in KES"
            inputMode="numeric"
            className="glass w-full rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="glass w-full rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <button
          onClick={send}
          disabled={sending}
          className="press mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send payout"}
        </button>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold mb-3">
          Payout history ({payouts?.length ?? 0})
        </h2>

        {isLoading ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
            No payouts yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {payouts.map((p: any) => {
              const meta = STATUS_META[p.status] ?? STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <div key={p.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black">{formatKes(p.amount_kes)}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.boutiques?.name ?? "General payout"} · {p.recipient_phone}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                  </div>
                  {p.reason && (
                    <div className="mt-2 text-xs text-muted-foreground">Reason: {p.reason}</div>
                  )}
                  {p.result_desc && (
                    <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                      {p.result_desc}
                      {p.transaction_id ? ` · Ref ${p.transaction_id}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}