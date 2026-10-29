import { useQuery } from "@tanstack/react-query";
import { Loader2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function formatKes(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export function SellerEarningsCard({ boutiqueId }: { boutiqueId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["seller-earnings", boutiqueId],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boutique_balances")
        .select("*")
        .eq("boutique_id", boutiqueId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  const owed = Math.floor(Math.max(0, Number(data?.owed_kes ?? 0)));
  const earned = Math.round(Number(data?.earned_kes ?? 0));
  const awaiting = Math.round(Number(data?.awaiting_delivery_kes ?? 0));
  const commission = Math.round(Number(data?.commission_kes ?? 0));
  const paidOut = Number(data?.paid_out_kes ?? 0);

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wallet className="h-4 w-4" />
        <span className="text-[11px] font-extrabold uppercase tracking-widest">Your earnings</span>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">Amount owed to you</div>
      <div className="text-3xl font-black">{formatKes(owed)}</div>
      <p className="mt-1 text-xs text-muted-foreground">
        Earnings from delivered orders, after MaeLove commission, minus payouts already sent.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Earned: {formatKes(earned)}</span>
        <span>Paid out: {formatKes(paidOut)}</span>
        <span>Awaiting delivery: {formatKes(awaiting)}</span>
        <span>Commission: {formatKes(commission)}</span>
      </div>
    </div>
  );
}