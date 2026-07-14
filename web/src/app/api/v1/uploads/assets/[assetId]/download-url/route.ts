import { getCurrentUser } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { storageOr503 } from "@/lib/server/storage";

const DOWNLOAD_EXPIRES_SECONDS = 900;

export const GET = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const storage = storageOr503();
  const { assetId } = await context.params;

  const asset = await prisma.contributionAsset.findUnique({
    where: { id: uuidParam(assetId, "asset_id") },
  });
  if (!asset) {
    throw new ApiError(404, "Asset not found");
  }
  await ownedContribution(asset.contributionId, user);

  return json({
    url: await storage.createDownloadUrl(asset.storageKey, DOWNLOAD_EXPIRES_SECONDS),
    expires_in: DOWNLOAD_EXPIRES_SECONDS,
  });
});
