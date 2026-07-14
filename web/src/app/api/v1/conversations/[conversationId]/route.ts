import { getCurrentUser } from "@/lib/server/auth";
import { ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { conversationDetail } from "@/lib/server/serializers";

export const GET = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { conversationId } = await context.params;
  const conversation = await prisma.conversationThread.findUnique({
    where: { id: uuidParam(conversationId, "conversation_id") },
    include: { turns: { orderBy: { turnOrder: "asc" } } },
  });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  await ownedContribution(conversation.contributionId, user);
  return json(conversationDetail(conversation));
});
