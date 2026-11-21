import { useMoney } from "@/lib/money";

/** Shows a price converted from its own currency to the buyer's currency. */
export default function Price({ cents, currency = "USD" }: { cents: number; currency?: string }) {
  const money = useMoney();
  return <>{money.format(cents, currency)}</>;
}