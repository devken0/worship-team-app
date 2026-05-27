import {
  SINGLE_ROLES,
  ROLE_LABELS,
  type Assignment,
} from "@/lib/domain";

export default function AssignmentsList({
  assignments,
  names,
  currentUserId,
}: {
  assignments: Assignment[];
  names: Record<string, string>;
  currentUserId?: string;
}) {
  const byRole = (role: string) =>
    assignments.filter((a) => a.role_type === role);

  const rows: { label: string; memberIds: string[] }[] = SINGLE_ROLES.map(
    (role) => ({
      label: ROLE_LABELS[role],
      memberIds: byRole(role)
        .map((a) => a.member_id)
        .filter((x): x is string => !!x),
    }),
  );

  const backups = byRole("backup_singer")
    .map((a) => a.member_id)
    .filter((x): x is string => !!x);
  if (backups.length) rows.push({ label: "Backup Singers", memberIds: backups });

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {rows.map((row) => {
        const mine = currentUserId && row.memberIds.includes(currentUserId);
        return (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="text-sm text-muted">{row.label}</span>
            <span
              className={`text-right text-sm font-medium ${mine ? "text-primary" : ""}`}
            >
              {row.memberIds.length
                ? row.memberIds.map((id) => names[id] ?? "—").join(", ")
                : "—"}
              {mine && (
                <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  YOU
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
