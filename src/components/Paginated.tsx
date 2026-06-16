"use client";

import { useState } from "react";

/**
 * Renders a server-built list of rows a page at a time with a "Load more"
 * button. The parent (a Server Component) does the data fetching and passes the
 * already-rendered rows as `items`, so this stays a thin client wrapper — only
 * the slice point lives in client state.
 */
export default function Paginated({
  items,
  pageSize = 12,
  className = "space-y-2",
}: {
  items: React.ReactNode[];
  pageSize?: number;
  className?: string;
}) {
  const [limit, setLimit] = useState(pageSize);
  const remaining = items.length - Math.min(limit, items.length);

  return (
    <div className="space-y-2">
      <div className={className}>{items.slice(0, limit)}</div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + pageSize)}
          className="w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-primary transition hover:bg-brand-soft active:scale-[0.99]"
        >
          Load {Math.min(pageSize, remaining)} more · {remaining} left
        </button>
      )}
    </div>
  );
}
