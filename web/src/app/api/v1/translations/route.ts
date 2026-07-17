import { getCurrentUser } from "@/lib/server/auth";
import { assertAuthor, ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { translationCreate } from "@/lib/server/schemas";
import { translationRead } from "@/lib/server/serializers";

const TEXT_CONTENT_TYPES = [
  "translation",
  "word",
  "sentence",
  "story",
  "proverb",
  "dictionary_entry",
  "cultural_knowledge",
];

export const POST = handle(async (request) => {
  const user = await getCurrentUser(request);
  const payload = await parseBody(request, translationCreate);

  const contribution = await ownedContribution(payload.contribution_id, user, {
    translation: true,
  });
  assertAuthor(contribution, user, "Only the author can edit");
  if (!TEXT_CONTENT_TYPES.includes(contribution.contributionType)) {
    throw new ApiError(422, "Contribution type must support text content");
  }
  if (contribution.status !== "draft") {
    throw new ApiError(409, "Contribution is no longer editable");
  }
  if (contribution.translation) {
    throw new ApiError(409, "Translation already exists");
  }

  const translation = await prisma.translationPair.create({
    data: {
      contributionId: payload.contribution_id,
      sourceText: payload.source_text,
      targetText: payload.target_text,
      context: payload.context,
      notes: payload.notes,
    },
  });
  return json(translationRead(translation), 201);
});
