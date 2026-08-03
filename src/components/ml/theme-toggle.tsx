import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "maelove.theme";

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = stored ? stored === "dark" : prefers;
    setDark(next);
    apply(next);
  }, []);

  function toggle() {
    setDark((d) => {
      const next = !d;
      localStorage.setItem(KEY, next ? "dark" : "light");
      apply(next);
      return next;
    });
  }

  return { dark, toggle };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`press glass flex h-9 w-9 items-center justify-center rounded-full ${className}`}
    >
      {dark ? <Sun className="h-4 w-4 text-honey" /> : <Moon className="h-4 w-4 text-primary" />}
    </button>
  );
}

export default ThemeToggle;
