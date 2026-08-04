import { Search, Mic, Camera } from "lucide-react";

/**
 * Premium pill search bar with search, voice and camera affordances.
 * Voice/camera are visual entry points; behaviour is unchanged.
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search boutiques, pieces, designers…",
  autoFocus,
  className = "",
}: {
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={`search-pill ${className}`}
      role="search"
    >
      <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label="Search MaeLove"
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
      />
      <span className="h-5 w-px shrink-0 bg-border" />
      <button
        type="button"
        aria-label="Voice search"
        className="press shrink-0 rounded-full p-1.5 text-primary hover:bg-accent/25"
      >
        <Mic className="h-[17px] w-[17px]" />
      </button>
      <button
        type="button"
        aria-label="Search by photo"
        className="press shrink-0 rounded-full p-1.5 text-primary hover:bg-accent/25"
      >
        <Camera className="h-[17px] w-[17px]" />
      </button>
    </form>
  );
}

export default SearchBar;
