import { getCurrentUser } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { translationRead } from "@/lib/server/serializers";

export const GET = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { translationId } = await context.params;
  const translation = await prisma.translationPair.findUnique({
    where: { id: uuidParam(translationId, "translation_id") },
  });
  if (!translation) {
    throw new ApiError(404, "Translation not found");
  }
  await ownedContribution(translation.contributionId, user);
  return json(translationRead(translation));
});
