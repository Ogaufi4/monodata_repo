import { getCurrentUser } from "@/lib/server/auth";
import { assertAuthor, ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { conversationCreate } from "@/lib/server/schemas";
import { conversationRead } from "@/lib/server/serializers";

export const POST = handle(async (request) => {
  const user = await getCurrentUser(request);
  const payload = await parseBody(request, conversationCreate);

  const contribution = await ownedContribution(payload.contribution_id, user, {
    conversation: true,
  });
  assertAuthor(contribution, user, "Only the author can edit");
  if (!["conversation", "dialogue"].includes(contribution.contributionType)) {
    throw new ApiError(422, "Contribution type must be conversation or dialogue");
  }
  if (contribution.status !== "draft") {
    throw new ApiError(409, "Contribution is no longer editable");
  }
  if (contribution.conversation) {
    throw new ApiError(409, "Conversation already exists");
  }

  const conversation = await prisma.conversationThread.create({
    data: {
      contributionId: payload.contribution_id,
      speakerCount: payload.speaker_count,
      context: payload.context,
    },
  });
  return json(conversationRead(conversation), 201);
});
