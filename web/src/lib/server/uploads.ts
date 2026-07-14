export const UPLOAD_EXPIRES_SECONDS = 900;

// Mirrors ALLOWED_CONTENT_TYPES in api/app/api/routes/uploads.py.
export const ALLOWED_CONTENT_TYPES: Record<string, [string, string]> = {
  "audio/wav": ["audio", "wav"],
  "audio/mpeg": ["audio", "mp3"],
  "audio/flac": ["audio", "flac"],
  "audio/aac": ["audio", "aac"],
  "audio/mp4": ["audio", "m4a"],
  "audio/x-m4a": ["audio", "m4a"],
  "audio/ogg": ["audio", "ogg"],
  "audio/webm": ["audio", "webm"],
  "image/jpeg": ["image", "jpg"],
  "image/png": ["image", "png"],
  "image/webp": ["image", "webp"],
  "image/gif": ["image", "gif"],
  "image/avif": ["image", "avif"],
  "image/bmp": ["image", "bmp"],
  "image/heic": ["image", "heic"],
  "image/heif": ["image", "heif"],
  "image/tiff": ["image", "tiff"],
  "video/mp4": ["video", "mp4"],
  "video/quicktime": ["video", "mov"],
  "video/webm": ["video", "webm"],
  "video/x-matroska": ["video", "mkv"],
  "application/pdf": ["document", "pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["document", "docx"],
  "text/plain": ["document", "txt"],
  "text/csv": ["document", "csv"],
  "application/json": ["document", "json"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["document", "xlsx"],
};

export function safeFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? "";
  const sanitized = basename.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "");
  return sanitized || "upload";
}
