import FormSkeleton from "@/components/FormSkeleton";

export default function NewSongLoading() {
  return (
    <FormSkeleton
      title="New song"
      subtitle="Add to the song book"
      back={{ href: "/manage/songs", label: "Back to song book" }}
    />
  );
}
