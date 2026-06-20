import FormSkeleton from "@/components/FormSkeleton";

export default function EditSongLoading() {
  return (
    <FormSkeleton
      title="Edit song"
      back={{ href: "/manage/songs", label: "Back to song book" }}
    />
  );
}
