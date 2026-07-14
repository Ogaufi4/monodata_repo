import { randomUUID } from "crypto";

import { getCurrentUser, signToken } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { env } from "@/lib/server/env";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { signedUploadRequest } from "@/lib/server/schemas";
import { storageOr503 } from "@/lib/server/storage";
import { ALLOWED_CONTENT_TYPES, safeFilename, UPLOAD_EXPIRES_SECONDS } from "@/lib/server/uploads";

export const POST = handle(async (request) => {
  const user = await getCurrentUser(request);
  const storage = storageOr503();
  const payload = await parseBody(request, signedUploadRequest);

  const contribution = await ownedContribution(payload.contribution_id, user);
  if (contribution.authorId !== user.id || contribution.status !== "draft") {
    throw new ApiError(
      409,
      "Assets can only be added by the author while the contribution is a draft",
    );
  }

  const contentType = payload.content_type.toLowerCase();
  const media = ALLOWED_CONTENT_TYPES[contentType];
  if (!media) {
    throw new ApiError(415, "File type not allowed");
  }
  if (payload.file_size > env.maxUploadBytes) {
    throw new ApiError(413, `File exceeds the ${env.maxUploadBytes}-byte limit`);
  }

  const [mediaType, fileFormat] = media;
  const filename = safeFilename(payload.filename);
  const storageKey = `contributions/${contribution.id}/${mediaType}/${randomUUID()}-${filename}`;

  const uploadToken = await signToken(
    {
      sub: user.id,
      contribution_id: contribution.id,
      storage_key: storageKey,
      filename,
      content_type: contentType,
      file_size: payload.file_size,
      media_type: mediaType,
      file_format: fileFormat,
      purpose: "upload_confirmation",
    },
    UPLOAD_EXPIRES_SECONDS,
  );

  return json({
    upload_url: await storage.createUploadUrl(storageKey, contentType, UPLOAD_EXPIRES_SECONDS),
    upload_token: uploadToken,
    storage_key: storageKey,
    expires_in: UPLOAD_EXPIRES_SECONDS,
    required_headers: { "Content-Type": contentType },
  });
});
