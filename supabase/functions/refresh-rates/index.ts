import { createClient } from "npm:@supabase/supabase-js@2";

// Refreshes exchange_rates from the same public rate source the M-Pesa
// checkout already uses. Takes no input, so it is safe to call without
// login. It only fetches from upstream when the stored rates are older
// than MIN_AGE_MINUTES, so repeated calls cost nothing.
const MIN_AGE_MINUTES = 60;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Skip if rates were refreshed recently (ignore the seed rows)
  const { data: last } = await db
    .from("exchange_rates")
    .select("updated_at")
    .neq("source", "seed")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last) {
    const ageMin = (Date.now() - new Date(last.updated_at).getTime()) / 60000;
    if (ageMin < MIN_AGE_MINUTES) {
      return json({ refreshed: false, reason: "rates are fresh", age_minutes: Math.round(ageMin) });
    }
  }

  let rates: Record<string, number> | undefined;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return json({ refreshed: false, error: `rate source returned ${res.status}` }, 502);
    const data = await res.json();
    rates = data?.rates;
  } catch (e) {
    return json({ refreshed: false, error: "could not reach rate source" }, 502);
  }
  if (!rates || typeof rates !== "object") {
    return json({ refreshed: false, error: "rate source returned no rates" }, 502);
  }

  // Only update currencies MaeLove supports, and only with sane numbers
  const { data: currencies } = await db.from("currencies").select("code").eq("active", true);
  const now = new Date().toISOString();
  const rows = (currencies ?? [])
    .map((c: { code: string }) => ({ code: c.code, rate: rates![c.code] }))
    .filter((r: { code: string; rate: unknown }) => typeof r.rate === "number" && r.rate > 0)
    .map((r: { code: string; rate: number }) => ({
      currency_code: r.code,
      rate_per_usd: r.rate,
      source: "open.er-api.com",
      updated_at: now,
    }));

  if (rows.length === 0) return json({ refreshed: false, error: "no usable rates" }, 502);

  const { error } = await db.from("exchange_rates").upsert(rows, { onConflict: "currency_code" });
  if (error) return json({ refreshed: false, error: error.message }, 500);

  return json({ refreshed: true, updated: rows.length });
});
