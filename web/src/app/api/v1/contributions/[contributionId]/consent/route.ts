import { getCurrentUser } from "@/lib/server/auth";
import { assertAuthor, ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody, uuidParam } from "@/lib/server/http";
import { consentCreate } from "@/lib/server/schemas";
import { consentRead } from "@/lib/server/serializers";

export const POST = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { contributionId } = await context.params;
  const payload = await parseBody(request, consentCreate);

  const contribution = await ownedContribution(
    uuidParam(contributionId, "contribution_id"),
    user,
    { consent: true },
  );
  assertAuthor(contribution, user, "Only the author can consent");
  if (contribution.status !== "draft") {
    throw new ApiError(409, "Contribution is no longer editable");
  }
  if (contribution.consent) {
    throw new ApiError(409, "Consent is already recorded");
  }

  const consent = await prisma.consent.create({
    data: {
      contributorId: user.id,
      contributionId: contribution.id,
      acceptedAt: new Date(),
      consentVersion: payload.consent_version,
      useForAiTraining: payload.use_for_ai_training,
      useForResearch: payload.use_for_research,
      useForCommercial: payload.use_for_commercial,
      allowOpenRelease: payload.allow_open_release,
      allowAttribution: payload.allow_attribution,
    },
  });
  return json(consentRead(consent), 201);
});
