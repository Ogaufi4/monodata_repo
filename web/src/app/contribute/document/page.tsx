import { MediaUploadForm } from "@/components/media-upload-form";

export default function DocumentPage() {
  return (
    <MediaUploadForm
      heading="Share a document"
      contributionType="document"
      mediaLabel="Document"
      accept=".pdf,.docx,.txt,.csv,.json,.xlsx"
    />
  );
}
