import { getCurrentUser } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { handle, json, uuidParam } from "@/lib/server/http";
import { assetRead } from "@/lib/server/serializers";

export const GET = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { contributionId } = await context.params;
  const contribution = await ownedContribution(
    uuidParam(contributionId, "contribution_id"),
    user,
    { assets: { orderBy: { createdAt: "asc" } } },
  );
  return json(contribution.assets.map(assetRead));
});
