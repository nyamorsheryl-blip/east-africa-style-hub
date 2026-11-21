import { supabase } from "@/integrations/supabase/client";

// The currency/exchange_rates tables are newer than the generated types, so
// this file talks to them through an untyped handle until types are regenerated.
const db = supabase as any;

export type CurrencyInfo = { code: string; name: string; symbol: string | null };
type RateMap = Record<string, number>; // units of each currency per 1 USD

const PREF_KEY = "maelove.currency";
const CACHE_KEY = "maelove.rates.v1";
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // reuse stored rates for 1 hour
const STALE_AFTER_MS = 6 * 60 * 60 * 1000; // ask the server to refresh after 6 hours

// Module state. Server rendering never changes it, so the server always
// renders in USD; the browser switches after load.
let displayCurrency = "USD";
let rates: RateMap = { USD: 1 };
let currencies: CurrencyInfo[] = [];
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const getVersion = () => version;
export const getDisplayCurrency = () => displayCurrency;
export const getCurrencies = () => currencies;

export function getStoredPreference(): string | null {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
}

export function setDisplayCurrency(code: string) {
  displayCurrency = code;
  try {
    localStorage.setItem(PREF_KEY, code);
  } catch {
    // storage unavailable (private mode); the choice just won't persist
  }
  emit();
}

/** Convert an amount in cents between currencies. Returns null if a rate is missing. */
export function convertCents(cents: number, from: string, to: string): number | null {
  if (from === to) return cents;
  const rFrom = rates[from];
  const rTo = rates[to];
  if (!rFrom || !rTo) return null;
  return Math.round((cents * rTo) / rFrom);
}

type CachePayload = { ts: number; currencies: CurrencyInfo[]; rates: RateMap };

function readCache(): CachePayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachePayload) : null;
  } catch {
    return null;
  }
}

function apply(payload: { currencies: CurrencyInfo[]; rates: RateMap }) {
  currencies = payload.currencies;
  rates = { USD: 1, ...payload.rates };
}

/** Fetch currencies and rates from the database. Returns the newest live-rate timestamp. */
async function fetchFromDatabase(): Promise<number | null> {
  const [cur, rt] = await Promise.all([
    db.from("currencies").select("code, name, symbol").eq("active", true).order("sort_order"),
    db.from("exchange_rates").select("currency_code, rate_per_usd, source, updated_at"),
  ]);
  if (cur.error || rt.error || !cur.data?.length || !rt.data?.length) {
    throw new Error("could not load currency data");
  }
  const map: RateMap = {};
  let newestLive = 0;
  for (const row of rt.data) {
    map[row.currency_code] = Number(row.rate_per_usd);
    if (row.source !== "seed") {
      newestLive = Math.max(newestLive, new Date(row.updated_at).getTime());
    }
  }
  const payload = { currencies: cur.data as CurrencyInfo[], rates: map };
  apply(payload);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), ...payload }));
  } catch {
    // ignore
  }
  return newestLive || null;
}

async function loadRates() {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < CACHE_MAX_AGE_MS) {
    apply(cached);
    return;
  }
  try {
    const newestLive = await fetchFromDatabase();
    // If the stored rates are old, ask the server to refresh them (it only
    // actually fetches if they are over an hour old), then reload once.
    if (!newestLive || Date.now() - newestLive > STALE_AFTER_MS) {
      try {
        const { data } = await supabase.functions.invoke("refresh-rates");
        if (data?.refreshed) {
          await fetchFromDatabase();
        }
      } catch {
        // keep the rates we already have
      }
    }
  } catch {
    if (cached) apply(cached);
  }
}

/** Run once in the browser on startup. */
export async function initCurrency(): Promise<{ hasPreference: boolean }> {
  const stored = getStoredPreference();
  await loadRates();
  const supported = currencies.some((c) => c.code === stored);
  if (stored && supported) displayCurrency = stored;
  emit();
  return { hasPreference: !!stored && supported };
}
