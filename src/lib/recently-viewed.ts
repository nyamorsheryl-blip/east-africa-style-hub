const KEY = "maelove.recently_viewed";
const MAX_ITEMS = 20;

type Entry = { id: string; viewedAt: number };

function read(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

/** Call when a real product page is viewed. Moves it to the front, dedupes, caps length. */
export function recordView(productId: string) {
  if (typeof window === "undefined") return;
  const existing = read().filter((e) => e.id !== productId);
  const next = [{ id: productId, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS);
  write(next);
}

/** Most-recently-viewed product ids first, optionally excluding one (e.g. the current page). */
export function getRecentlyViewedIds(excludeId?: string): string[] {
  return read()
    .filter((e) => e.id !== excludeId)
    .map((e) => e.id);
}