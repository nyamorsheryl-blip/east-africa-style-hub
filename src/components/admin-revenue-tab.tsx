import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const RANGES: { id: string; label: string; days: number | null }[] = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

// Ledger amounts are stored in KES cents
function kesFromCents(cents: number) {
  return `KES ${Math.round(cents / 100).toLocaleString("en-KE")}`;
}
function kes(n: number) {
  return `KES ${Math.round(n).toLocaleString("en-KE")}`;
}

type Row = {
  boutique_id: string;
  status: string;
  gross_cents: number;
  commission_cents: number;
  seller_net_cents: number;
  refunded_gross_cents: number;
};

export function RevenueTab() {
  const [rangeId, setRangeId] = useState("30");
  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[1];
  const since = range.days ? new Date(Date.now() - range.days * 86400000).toISOString() : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-revenue", rangeId],
    refetchInterval: 30000,
    queryFn: async () => {
      const db = supabase as any;

      let recQ = db
        .from("commission_records")
        .select("boutique_id, status, gross_cents, commission_cents, seller_net_cents, refunded_gross_cents")
        .limit(5000);
      if (since) recQ = recQ.gte("created_at", since);

      let payQ = db
        .from("payouts")
        .select("amount_kes, status")
        .in("status", ["pending", "processing", "completed"])
        .limit(5000);
      if (since) payQ = payQ.gte("created_at", since);

      const [rec, pay, bal, bout] = await Promise.all([
        recQ,
        payQ,
        db.from("boutique_balances").select("boutique_id, owed_kes"),
        db.from("boutiques").select("id, name"),
      ]);
      if (rec.error) throw rec.error;
      if (pay.error) throw pay.error;
      if (bal.error) throw bal.error;
      if (bout.error) throw bout.error;

      return {
        records: (rec.data ?? []) as Row[],
        payouts: (pay.data ?? []) as { amount_kes: number }[],
        balances: (bal.data ?? []) as { boutique_id: string; owed_kes: number }[],
        boutiques: (bout.data ?? []) as { id: string; name: string }[],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">
        Couldn't load revenue figures. Please refresh in a moment.
      </div>
    );
  }

  const finalized = data.records.filter((r) => r.status === "finalized");
  const reversed = data.records.filter((r) => r.status === "reversed");

  const sales = finalized.reduce((s, r) => s + Number(r.gross_cents), 0);
  const commission = finalized.reduce((s, r) => s + Number(r.commission_cents), 0);
  const sellerEarnings = finalized.reduce((s, r) => s + Number(r.seller_net_cents), 0);
  const returned = reversed.reduce((s, r) => s + Number(r.refunded_gross_cents), 0);
  const paidOut = data.payouts.reduce((s, p) => s + Number(p.amount_kes), 0);
  const owedNow = data.balances.reduce((s, b) => s + Number(b.owed_kes), 0);

  const nameById = new Map(data.boutiques.map((b) => [b.id, b.name]));
  const owedById = new Map(data.balances.map((b) => [b.boutique_id, Number(b.owed_kes)]));
  const byBoutique = new Map<string, { sales: number; commission: number }>();
  for (const r of finalized) {
    const cur = byBoutique.get(r.boutique_id) ?? { sales: 0, commission: 0 };
    cur.sales += Number(r.gross_cents);
    cur.commission += Number(r.commission_cents);
    byBoutique.set(r.boutique_id, cur);
  }
  const rows = Array.from(byBoutique.entries())
    .map(([id, v]) => ({
      id,
      name: nameById.get(id) ?? "Unknown boutique",
      sales: v.sales,
      commission: v.commission,
      owed: owedById.get(id) ?? 0,
    }))
    .sort((a, b) => b.sales - a.sales);

  const cards: { label: string; value: string; hint: string }[] = [
    { label: "Sales", value: kesFromCents(sales), hint: "Delivered, paid orders" },
    { label: "Commission earned", value: kesFromCents(commission), hint: "MaeLove's share" },
    { label: "Seller earnings", value: kesFromCents(sellerEarnings), hint: "After commission" },
    { label: "Returned", value: kesFromCents(returned), hint: "Refunded to customers" },
    { label: "Paid out", value: kes(paidOut), hint: "Payouts sent to sellers" },
    { label: "Owed to sellers now", value: kes(owedNow), hint: "Current balance, all time" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Revenue</h2>
        <div className="glass rounded-full p-1 inline-flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeId(r.id)}
              className={`press rounded-full px-4 py-1.5 text-xs font-bold ${
                rangeId === r.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {c.label}
            </div>
            <div className="mt-1 text-xl font-black md:text-2xl">{c.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{c.hint}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 font-display text-base font-semibold">By boutique</h3>
        {rows.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">
            No delivered orders in this period yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-4">
                <div className="text-sm font-bold">{r.name}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>
                    Sales
                    <br />
                    <b className="text-foreground">{kesFromCents(r.sales)}</b>
                  </span>
                  <span>
                    Commission
                    <br />
                    <b className="text-foreground">{kesFromCents(r.commission)}</b>
                  </span>
                  <span>
                    Owed now
                    <br />
                    <b className="text-foreground">{kes(Math.max(0, r.owed))}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}