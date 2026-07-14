import { getCurrentUser } from "@/lib/server/auth";
import { editableConversation } from "@/lib/server/conversations";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody, uuidParam } from "@/lib/server/http";
import { turnCreate } from "@/lib/server/schemas";
import { turnRead } from "@/lib/server/serializers";

export const POST = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { conversationId } = await context.params;
  const payload = await parseBody(request, turnCreate);

  const conversation = await editableConversation(
    uuidParam(conversationId, "conversation_id"),
    user,
  );
  const duplicate = await prisma.conversationTurn.findUnique({
    where: {
      conversationId_turnOrder: {
        conversationId: conversation.id,
        turnOrder: payload.turn_order,
      },
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ApiError(409, "Turn order already exists");
  }

  const turn = await prisma.conversationTurn.create({
    data: {
      conversationId: conversation.id,
      turnOrder: payload.turn_order,
      speakerLabel: payload.speaker_label,
      speakerRole: payload.speaker_role,
      sourceText: payload.source_text,
      targetText: payload.target_text,
      notes: payload.notes,
      reviewStatus: "draft",
    },
  });
  return json(turnRead(turn), 201);
});
