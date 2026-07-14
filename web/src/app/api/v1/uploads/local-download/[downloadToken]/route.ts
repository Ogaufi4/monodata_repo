import { ApiError, handle } from "@/lib/server/http";
import { LocalObjectStorage, storageOr503, verifyPurposeToken } from "@/lib/server/storage";

export const GET = handle(async (_request, context) => {
  const storage = storageOr503();
  if (!(storage instanceof LocalObjectStorage)) {
    throw new ApiError(404, "Not found");
  }
  const { downloadToken } = await context.params;

  try {
    const claims = await verifyPurposeToken(downloadToken, "local_object_download");
    const { content, contentType } = await storage.readObject(String(claims.storage_key));
    return new Response(new Uint8Array(content), {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid or expired download URL");
  }
});
