import { getCurrentUser } from "@/lib/server/auth";
import { assertAuthor, ownedContribution } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { contributionRead } from "@/lib/server/serializers";

// Which prompt pool a contribution draws from, so completions are counted
// against the right task when the cap is enforced.
const PROMPT_TASK_BY_TYPE: Record<string, string> = {
  translation: "translation",
  conversation: "conversation",
  dialogue: "conversation",
  audio_recording: "pronunciation",
  pronunciation: "pronunciation",
};

const ASSET_REQUIRED_TYPES = [
  "audio_recording",
  "pronunciation",
  "image",
  "labeled_image",
  "video",
  "document",
];

export const POST = handle(async (request, context) => {
  const user = await getCurrentUser(request);
  const { contributionId } = await context.params;
  const contribution = await ownedContribution(
    uuidParam(contributionId, "contribution_id"),
    user,
    {
      consent: true,
      translation: true,
      conversation: { include: { turns: true } },
      assets: true,
    },
  );
  assertAuthor(contribution, user, "Only the author can submit");
  if (contribution.status !== "draft") {
    throw new ApiError(409, "Only drafts can be submitted");
  }

  const missing: string[] = [];
  if (!contribution.consent) {
    missing.push("consent");
  }
  if (contribution.contributionType === "translation" && !contribution.translation) {
    missing.push("translation");
  }
  if (["conversation", "dialogue"].includes(contribution.contributionType)) {
    if (!contribution.conversation) {
      missing.push("conversation");
    } else if (contribution.conversation.turns.length === 0) {
      missing.push("conversation_turns");
    }
  }
  if (
    ASSET_REQUIRED_TYPES.includes(contribution.contributionType) &&
    contribution.assets.length === 0
  ) {
    missing.push("asset");
  }
  if (contribution.contributionType === "labeled_image" && contribution.assets.length > 0) {
    const annotationCount = await prisma.imageAnnotation.count({
      where: { assetId: { in: contribution.assets.map((asset) => asset.id) } },
    });
    if (annotationCount === 0) {
      missing.push("image_annotation");
    }
  }
  if (missing.length > 0) {
    throw new ApiError(422, { message: "Contribution is incomplete", missing });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const submitted = await tx.contribution.update({
      where: { id: contribution.id },
      data: { status: "submitted", submittedAt: new Date() },
    });

    if (contribution.promptItemId) {
      const taskType = PROMPT_TASK_BY_TYPE[contribution.contributionType] ?? "pronunciation";
      const languageId = contribution.targetLanguageId ?? contribution.languageId;
      await tx.promptCompletion.upsert({
        where: {
          promptItemId_languageId_userId_taskType: {
            promptItemId: contribution.promptItemId,
            languageId,
            userId: user.id,
            taskType,
          },
        },
        create: {
          promptItemId: contribution.promptItemId,
          languageId,
          userId: user.id,
          contributionId: contribution.id,
          taskType,
          status: "submitted",
        },
        update: {
          contributionId: contribution.id,
          status: "submitted",
        },
      });
    }

    return submitted;
  });
  return json(contributionRead(updated));
});
