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
  const major = amountMinor / 100;
  const whole = Math.abs(major) >= 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
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

/** Currency of the shopper's country (reuses the cache written by geo.ts). */
function useGeoCode() {
  return useQuery({
    queryKey: ["geo_currency_code"],
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      try {
        const cached = localStorage.getItem("maelove.geo");
        if (cached) {
          const c = JSON.parse(cached)?.geo?.currency;
          if (c) return c as string;
        }
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch("https://ipapi.co/json/");
        const g = await res.json();
        return (g.currency as string) || "USD";
      } catch {
        return "USD";
      }
    },
  });
}

/**
 * Show any price in the buyer's currency.
 * Buyer's currency = saved preferred currency, else fallbackCurrency,
 * else their country's currency, else USD. Unsupported currencies fall back to USD.
 */
export function useMoney(fallbackCurrency?: string) {
  const { data: rates } = useRates();
  const { data: preferred } = usePreferredCurrency();
  const { data: geo } = useGeoCode();
  const display =
    [preferred, fallbackCurrency, geo].find((c) => !!c && (!rates || !!rates[c as string])) ?? "USD";

  const convert = useCallback(
    (amountMinor: number, from = "USD", to = display) =>
      rates ? convertMinor(amountMinor, from, to, rates) : null,
    [rates, display]
  );

  const format = useCallback(
    (amountMinor: number, from = "USD") => {
      const converted = rates ? convertMinor(amountMinor, from, display, rates) : null;
      // If rates aren't loaded yet, show the seller's own currency rather than a wrong number
      return converted === null ? formatMinor(amountMinor, from) : formatMinor(converted, display);
    },
    [rates, display]
  );

  return { display: display as string, convert, format, ready: !!rates };
}