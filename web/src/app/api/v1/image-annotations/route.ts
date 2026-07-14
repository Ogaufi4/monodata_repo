import { getCurrentUser } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { annotationCreate } from "@/lib/server/schemas";
import { annotationRead } from "@/lib/server/serializers";

export const POST = handle(async (request) => {
  const user = await getCurrentUser(request);
  const payload = await parseBody(request, annotationCreate);

  const asset = await prisma.contributionAsset.findUnique({ where: { id: payload.asset_id } });
  if (!asset || asset.mediaType !== "image") {
    throw new ApiError(422, "Unknown image asset");
  }
  const contribution = await ownedContribution(asset.contributionId, user);
  if (contribution.authorId !== user.id || contribution.status !== "draft") {
    throw new ApiError(409, "Image is no longer editable");
  }

  const annotation = await prisma.imageAnnotation.create({
    data: {
      assetId: payload.asset_id,
      createdBy: user.id,
      labelName: payload.label_name,
      labelLanguageId: payload.label_language_id,
      labelTranslation: payload.label_translation,
      annotationType: payload.annotation_type,
      xMin: payload.x_min,
      yMin: payload.y_min,
      xMax: payload.x_max,
      yMax: payload.y_max,
      confidence: payload.confidence,
      isSynthetic: payload.is_synthetic,
      reviewStatus: "draft",
      humanVerified: false,
    },
  });
  return json(annotationRead(annotation), 201);
});
