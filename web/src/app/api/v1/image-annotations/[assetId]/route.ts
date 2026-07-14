import { getCurrentUser } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { annotationRead } from "@/lib/server/serializers";

export const GET = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { assetId } = await context.params;
  const id = uuidParam(assetId, "asset_id");

  const asset = await prisma.contributionAsset.findUnique({ where: { id } });
  if (!asset) {
    throw new ApiError(404, "Asset not found");
  }
  await ownedContribution(asset.contributionId, user);

  const annotations = await prisma.imageAnnotation.findMany({
    where: { assetId: id },
    orderBy: { createdAt: "asc" },
  });
  return json(annotations.map(annotationRead));
});
