import { useCurrencies } from "@/lib/money";

export default function CurrencySelect({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  const { data: currencies } = useCurrencies();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-xl border px-3 py-2 bg-transparent ${className}`}
      aria-label="Price currency"
    >
      {(currencies ?? [{ code: "USD", name: "US Dollar", symbol: "$" }]).map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} - {c.name}
        </option>
      ))}
    </select>
  );
}