import FormSkeleton from "@/components/FormSkeleton";

export default function EditServiceLoading() {
  return (
    <FormSkeleton
      title="Edit schedule"
      back={{ href: "/manage", label: "Back to manage" }}
    />
  );
}
