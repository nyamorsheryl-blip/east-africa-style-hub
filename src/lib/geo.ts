import { useEffect, useState } from "react";

const CACHE_KEY = "maelove.geo";
const CACHE_HOURS = 24;

type GeoInfo = {
  country: string;
  countryCode: string;
  currency: string;
  rate: number;
};

const FALLBACK: GeoInfo = { country: "Kenya", countryCode: "KE", currency: "USD", rate: 1 };

async function fetchGeo(): Promise<GeoInfo> {
  const geoRes = await fetch("https://ipapi.co/json/");
  const geo = await geoRes.json();
  const currency: string = geo.currency || "USD";
  const country: string = geo.country_name || FALLBACK.country;
  const countryCode: string = geo.country_code || FALLBACK.countryCode;

  if (currency === "USD") {
    return { country, countryCode, currency, rate: 1 };
  }

  const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
  const rateData = await rateRes.json();
  const rate = rateData?.rates?.[currency] ?? 1;

  return { country, countryCode, currency, rate };
}

export function useGeoCurrency() {
  const [geo, setGeo] = useState<GeoInfo>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const ageHours = (Date.now() - parsed.ts) / 36e5;
          if (ageHours < CACHE_HOURS) {
            if (active) { setGeo(parsed.geo); setLoading(false); }
            return;
          }
        }
        const fresh = await fetchGeo();
        localStorage.setItem(CACHE_KEY, JSON.stringify({ geo: fresh, ts: Date.now() }));
        if (active) setGeo(fresh);
      } catch {
        // Silent fallback
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  function convert(usdCents: number) {
    return Math.round(usdCents * geo.rate);
  }

  return { ...geo, loading, convert };
}