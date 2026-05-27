import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader, Card, EmptyState } from "@/components/ui";
import { MicIcon } from "@/components/icons";
import { formatServiceDate } from "@/lib/format";
import type { Service } from "@/lib/domain";

export default async function RecordingsIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [{ data: services }, { data: recs }] = await Promise.all([
    supabase
      .from("services")
      .select("id, service_date")
      .order("service_date", { ascending: false }),
    supabase.from("recordings").select("service_id"),
  ]);

  const counts = new Map<string, number>();
  for (const r of recs ?? []) {
    counts.set(r.service_id, (counts.get(r.service_id) ?? 0) + 1);
  }

  const list = (services ?? []) as Pick<Service, "id" | "service_date">[];

  return (
    <>
      <PageHeader title="Recordings" subtitle="Listen back & improve" />
      <Page>
        {list.length === 0 ? (
          <EmptyState
            icon={<MicIcon size={24} />}
            title="No services yet"
            hint="Recordings are organized by Sunday service."
          />
        ) : (
          <div className="space-y-2">
            {list.map((s) => {
              const n = counts.get(s.id) ?? 0;
              return (
                <Link
                  key={s.id}
                  href={`/recordings/${s.id}`}
                  className="block transition active:scale-[0.98]"
                >
                  <Card className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {formatServiceDate(s.service_date)}
                    </span>
                    <span className="text-sm text-muted">
                      {n === 0
                        ? "Add recording ›"
                        : `${n} recording${n > 1 ? "s" : ""} ›`}
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Page>
    </>
  );
}
