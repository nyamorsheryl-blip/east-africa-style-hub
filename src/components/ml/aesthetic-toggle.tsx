import { useEffect, useState } from "react";

const KEY = "maelove.aesthetic";
export type Aesthetic = "glass" | "maximalist";

function apply(mode: Aesthetic) {
  document.documentElement.classList.toggle("theme-maximalist", mode === "maximalist");
}

export function useAesthetic() {
  const [mode, setMode] = useState<Aesthetic>("glass");

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as Aesthetic | null;
    const next = stored ?? "glass";
    setMode(next);
    apply(next);
  }, []);

  function setAesthetic(next: Aesthetic) {
    localStorage.setItem(KEY, next);
    apply(next);
    setMode(next);
  }

  return { mode, setAesthetic };
}