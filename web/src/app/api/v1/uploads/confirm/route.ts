import { getCurrentUser } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { confirmUploadRequest } from "@/lib/server/schemas";
import { assetRead } from "@/lib/server/serializers";
import { storageOr503, verifyPurposeToken } from "@/lib/server/storage";

type UploadClaims = {
  sub: string;
  contribution_id: string;
  storage_key: string;
  filename: string;
  content_type: string;
  file_size: number;
  media_type: string;
  file_format: string;
};

export const POST = handle(async (request) => {
  const user = await getCurrentUser(request);
  const storage = storageOr503();
  const payload = await parseBody(request, confirmUploadRequest);

  let claims: UploadClaims;
  try {
    const raw = await verifyPurposeToken(payload.upload_token, "upload_confirmation");
    if (raw.sub !== user.id) {
      throw new Error("wrong uploader");
    }
    claims = raw as UploadClaims;
  } catch {
    throw new ApiError(401, "Invalid or expired upload token");
  }

  const contribution = await ownedContribution(claims.contribution_id, user);
  if (contribution.authorId !== user.id || contribution.status !== "draft") {
    throw new ApiError(409, "Contribution is no longer editable");
  }

  const existing = await prisma.contributionAsset.findUnique({
    where: { storageKey: claims.storage_key },
  });
  if (existing) {
    return json(assetRead(existing), 201);
  }

  let metadata: { contentLength: number; contentType: string };
  try {
    metadata = await storage.objectMetadata(claims.storage_key);
  } catch {
    throw new ApiError(422, "Uploaded object could not be verified");
  }
  if (
    metadata.contentLength !== claims.file_size ||
    metadata.contentType.toLowerCase() !== claims.content_type
  ) {
    throw new ApiError(422, "Uploaded object metadata does not match the signed request");
  }

  const asset = await prisma.contributionAsset.create({
    data: {
      contributionId: contribution.id,
      uploadedBy: user.id,
      storageKey: claims.storage_key,
      originalFilename: claims.filename,
      mediaType: claims.media_type,
      contentType: claims.content_type,
      fileSize: metadata.contentLength,
      checksum: payload.checksum,
      duration: payload.duration,
      fileFormat: claims.file_format,
      status: "confirmed",
    },
  });
  return json(assetRead(asset), 201);
});
