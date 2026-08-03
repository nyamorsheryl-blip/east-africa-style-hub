/**
 * MaeLove brand mark — two cherries on one stem with a honey leaf.
 * Flat, no outlines, legible down to 24px.
 */
export function CherryMark({
  className = "h-6 w-6",
  title = "MaeLove",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <path
        d="M30.5 9c-6.2 2.6-10.4 8-12.4 15.4a2.6 2.6 0 1 0 5 1.4C24.7 19.9 27.9 15.9 32.6 14c1.9 3.9 3 8 3.3 12.4a2.6 2.6 0 1 0 5.2-.4c-.4-6.2-2.2-11.9-5.4-17.1A2.6 2.6 0 0 0 30.5 9Z"
        fill="var(--cherry-dark)"
      />
      <path
        d="M36.4 6.6c4 .2 6.8 2.3 8.4 6.1-4.1.7-7.1-.3-9-3a3.6 3.6 0 0 1 .6-3.1Z"
        fill="var(--honey)"
      />
      <circle cx="15" cy="34" r="9" fill="var(--cherry)" />
      <circle cx="33" cy="36.5" r="8" fill="var(--cherry-pink)" />
    </svg>
  );
}

export function CherryBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`glass flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl p-2 ${className}`}
    >
      <CherryMark className="h-full w-full" />
    </span>
  );
}

export default CherryMark;
