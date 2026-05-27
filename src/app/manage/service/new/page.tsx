import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Page, PageHeader } from "@/components/ui";
import ServiceForm, { type MemberOption } from "@/components/ServiceForm";

export default async function NewServicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");
  const members = (data ?? []) as MemberOption[];

  return (
    <>
      <PageHeader title="New schedule" subtitle="Set up a Sunday service" />
      <Page>
        <ServiceForm members={members} />
      </Page>
    </>
  );
}
