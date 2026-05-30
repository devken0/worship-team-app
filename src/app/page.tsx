import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentOrNextService } from "@/lib/services";
import { Page, PageHeader, Card, EmptyState } from "@/components/ui";
import { CalendarIcon } from "@/components/icons";
import ServiceDetailView from "@/components/ServiceDetailView";
import { formatServiceDate, todayInManila } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/domain";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile) redirect("/welcome");

  const firstName = (user.profile.full_name || "").split(" ")[0] || "there";
  const isAdmin = user.profile.role === "admin";
  const detail = await getCurrentOrNextService();

  if (!detail) {
    return (
      <>
        <PageHeader title={`Hi, ${firstName} 👋`} subtitle="This Sunday" />
        <Page>
          <EmptyState
            icon={<CalendarIcon size={24} />}
            title="No schedule posted yet"
            hint="Check back when an admin sets up the next Sunday."
          />
        </Page>
      </>
    );
  }

  // What is this person doing this service?
  const myRoles: string[] = detail.assignments
    .filter((a) => a.member_id === user.id)
    .map((a) => ROLE_LABELS[a.role_type]);
  const leadCount = detail.songs.filter(
    (s) => s.song_leader_id === user.id,
  ).length;
  if (leadCount > 0) {
    myRoles.push(
      leadCount === 1
        ? "Song Leader (1 song)"
        : `Song Leader (${leadCount} songs)`,
    );
  }

  const isUpcoming = detail.service.service_date >= todayInManila();

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName} 👋`}
        subtitle={isUpcoming ? "This Sunday" : "Most recent service"}
      />
      <Page>
        <Card className="mb-3 bg-primary text-primary-foreground">
          <p className="text-sm opacity-90">
            {isUpcoming ? "Sunday service" : "Service"}
          </p>
          <p className="text-lg font-bold">
            {formatServiceDate(detail.service.service_date)}
          </p>
          <div className="mt-3 border-t border-white/20 pt-3">
            <p className="text-sm opacity-90">Your role</p>
            {myRoles.length ? (
              <p className="font-semibold">{myRoles.join(" • ")}</p>
            ) : (
              <p className="font-medium opacity-90">
                Not assigned this week — come worship with us!
              </p>
            )}
          </div>
        </Card>

        <ServiceDetailView
          detail={detail}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </Page>
    </>
  );
}
