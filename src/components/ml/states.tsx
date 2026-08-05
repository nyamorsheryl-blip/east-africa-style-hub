import type { CSSProperties, ReactNode } from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`shimmer rounded-2xl bg-muted ${className}`} style={style} />;
}


export function ProductSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass overflow-hidden rounded-3xl">
          <Skeleton className="aspect-[4/5] rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  copy,
  action,
}: {
  icon?: ReactNode;
  title: string;
  copy?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass mx-5 rounded-3xl px-8 py-14 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full glass-blush">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-black tracking-tight">{title}</h3>
      {copy && <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{copy}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="glass mx-5 rounded-3xl px-8 py-12 text-center">
      <h3 className="text-lg font-black tracking-tight">Something went wrong</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message ?? "Please try again in a moment."}</p>
      {onRetry && (
        <button onClick={onRetry} className="press mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
          Try again
        </button>
      )}
    </div>
  );
}
