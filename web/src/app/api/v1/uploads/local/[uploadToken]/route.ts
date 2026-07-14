import { env } from "@/lib/server/env";
import { ApiError, handle } from "@/lib/server/http";
import { LocalObjectStorage, storageOr503, verifyPurposeToken } from "@/lib/server/storage";

export const PUT = handle(async (request, context) => {
  const storage = storageOr503();
  if (!(storage instanceof LocalObjectStorage)) {
    throw new ApiError(404, "Not found");
  }
  const { uploadToken } = await context.params;

  let storageKey: string;
  let contentType: string;
  try {
    const claims = await verifyPurposeToken(uploadToken, "local_object_upload");
    storageKey = String(claims.storage_key);
    contentType = String(claims.content_type);
    if (!claims.storage_key || !claims.content_type) {
      throw new Error("missing claims");
    }
  } catch {
    throw new ApiError(401, "Invalid or expired upload URL");
  }

  if ((request.headers.get("content-type") ?? "").toLowerCase() !== contentType) {
    throw new ApiError(422, "Content-Type mismatch");
  }
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > env.maxUploadBytes) {
    throw new ApiError(413, "File too large");
  }
  const content = Buffer.from(await request.arrayBuffer());
  if (content.length > env.maxUploadBytes) {
    throw new ApiError(413, "File too large");
  }
  await storage.putObject(storageKey, contentType, content);
  return new Response(null, { status: 204 });
});
