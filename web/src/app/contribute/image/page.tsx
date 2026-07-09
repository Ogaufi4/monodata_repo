import { MediaUploadForm } from "@/components/media-upload-form";

export default function ImagePage() {
  return (
    <MediaUploadForm
      heading="Share an image"
      contributionType="image"
      mediaLabel="Image"
      accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.heic,.heif,.tif,.tiff,image/*"
      capture="environment"
    />
  );
}
