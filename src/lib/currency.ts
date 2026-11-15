import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Currency = { code: string; name: string; symbol: string };

/** Convert minor units (cents) between two currencies using USD-based rates. */
export function convertMinor(
  amountMinor: number,
  from: string,
  to: string,
  ratesPerUsd: Record<string, number>
): number | null {
  if (from === to) return amountMinor;
  const f = ratesPerUsd[from];
  const t = ratesPerUsd[to];
  if (!f || !t) return null;
  return Math.round((amountMinor / f) * t);
}

export function formatMinor(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
}

export function useRates() {
  return useQuery({
    queryKey: ["exchange_rates"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("exchange_rates").select("currency_code, rate_per_usd");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) map[r.currency_code] = Number(r.rate_per_usd);
      return map;
    },
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("currencies")
        .select("code, name, symbol")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Currency[];
    },
  });
}

/** The logged-in user's saved preferred currency (null if logged out or not set). */
export function usePreferredCurrency() {
  return useQuery({
    queryKey: ["preferred_currency"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return null;
      const { data } = await supabase.from("profiles").select("preferred_currency").eq("id", uid).maybeSingle();
      return (data?.preferred_currency as string | null) ?? null;
    },
  });
}

/**
 * Show any price in the buyer's currency.
 * Buyer's currency = saved preferred currency, else fallbackCurrency
 * (pass the code from your existing geo hook), else USD.
 */
export function useMoney(fallbackCurrency = "USD") {
  const { data: rates } = useRates();
  const { data: preferred } = usePreferredCurrency();
  const display = preferred ?? fallbackCurrency;

  const convert = useCallback(
    (amountMinor: number, from = "USD", to = display) =>
      rates ? convertMinor(amountMinor, from, to, rates) : null,
    [rates, display]
  );

  const format = useCallback(
    (amountMinor: number, from = "USD") => {
      const converted = rates ? convertMinor(amountMinor, from, display, rates) : null;
      return converted === null ? formatMinor(amountMinor, from) : formatMinor(converted, display);
    },
    [rates, display]
  );

  return { display, convert, format, ready: !!rates };
}