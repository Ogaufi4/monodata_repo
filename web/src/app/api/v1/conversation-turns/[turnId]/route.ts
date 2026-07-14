import type { Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/server/auth";
import { editableConversation } from "@/lib/server/conversations";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody, uuidParam } from "@/lib/server/http";
import { turnUpdate } from "@/lib/server/schemas";
import { turnRead } from "@/lib/server/serializers";

export const PATCH = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { turnId } = await context.params;
  const payload = await parseBody(request, turnUpdate);

  const turn = await prisma.conversationTurn.findUnique({
    where: { id: uuidParam(turnId, "turn_id") },
  });
  if (!turn) {
    throw new ApiError(404, "Conversation turn not found");
  }
  await editableConversation(turn.conversationId, user);

  if (payload.turn_order !== undefined) {
    const duplicate = await prisma.conversationTurn.findFirst({
      where: {
        conversationId: turn.conversationId,
        turnOrder: payload.turn_order,
        NOT: { id: turn.id },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ApiError(409, "Turn order already exists");
    }
  }

  // exclude_unset semantics: only keys present in the request are applied.
  const data: Prisma.ConversationTurnUpdateInput = {};
  if (payload.turn_order !== undefined) data.turnOrder = payload.turn_order;
  if (payload.speaker_label !== undefined) data.speakerLabel = payload.speaker_label;
  if (payload.speaker_role !== undefined) data.speakerRole = payload.speaker_role;
  if (payload.source_text !== undefined) data.sourceText = payload.source_text;
  if (payload.target_text !== undefined) data.targetText = payload.target_text;
  if (payload.notes !== undefined) data.notes = payload.notes;

  const updated = await prisma.conversationTurn.update({ where: { id: turn.id }, data });
  return json(turnRead(updated));
});

export const DELETE = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { turnId } = await context.params;

  const turn = await prisma.conversationTurn.findUnique({
    where: { id: uuidParam(turnId, "turn_id") },
  });
  if (!turn) {
    throw new ApiError(404, "Conversation turn not found");
  }
  await editableConversation(turn.conversationId, user);
  await prisma.conversationTurn.delete({ where: { id: turn.id } });
  return new Response(null, { status: 204 });
});
