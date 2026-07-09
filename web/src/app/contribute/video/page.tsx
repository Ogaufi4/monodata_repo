import { MediaUploadForm } from "@/components/media-upload-form";

export default function VideoPage() {
  return (
    <MediaUploadForm
      heading="Share a video"
      contributionType="video"
      mediaLabel="Video"
      accept=".mp4,.mov,.webm,.mkv,video/mp4,video/quicktime,video/webm,video/x-matroska"
    />
  );
}
