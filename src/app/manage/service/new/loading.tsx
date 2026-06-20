import FormSkeleton from "@/components/FormSkeleton";

export default function NewServiceLoading() {
  return (
    <FormSkeleton
      title="New schedule"
      subtitle="Set up a Sunday service"
      back={{ href: "/manage", label: "Back to manage" }}
    />
  );
}
