import { MediaUploadForm } from "@/components/media-upload-form";

export default function AudioPage() {
  return (
    <MediaUploadForm
      heading="Share a voice recording"
      contributionType="audio_recording"
      mediaLabel="Audio"
      accept=".wav,.mp3,.flac,.aac,.m4a,.ogg,.webm,audio/*"
      enableRecording
    />
  );
}
