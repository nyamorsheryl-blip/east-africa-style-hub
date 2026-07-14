export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export const CATEGORIES = [
  "Women's Clothing",
  "Men's Clothing",
  "Children's Clothing",
  "Shoes",
  "Handbags",
  "Jewellery",
  "Watches",
  "Accessories",
  "Handmade",
  "Luxury",
] as const;

export const COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Rwanda", "Burundi", "Ethiopia", "South Sudan"] as const;

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}
