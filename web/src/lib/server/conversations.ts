import type { ConversationThread } from "@prisma/client";

import type { AuthenticatedUser } from "@/lib/server/auth";
import { assertAuthor, ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/http";

/** Mirrors editable_conversation in api/app/api/routes/conversations.py. */
export async function editableConversation(
  conversationId: string,
  user: AuthenticatedUser,
): Promise<ConversationThread> {
  const conversation = await prisma.conversationThread.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  const contribution = await ownedContribution(conversation.contributionId, user);
  assertAuthor(contribution, user, "Only the author can edit");
  if (contribution.status !== "draft") {
    throw new ApiError(409, "Conversation is no longer editable");
  }
  return conversation;
}
