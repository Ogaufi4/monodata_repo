import { requireRoles } from "@/lib/server/auth";
import { userWallet } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody, uuidParam } from "@/lib/server/http";
import { reviewRequest } from "@/lib/server/schemas";
import { reviewRead } from "@/lib/server/serializers";

// Mirrors COIN_AWARDS in api/app/api/routes/workflow.py.
const COIN_AWARDS: Record<string, number> = {
  translation: 5,
  conversation: 20,
  dialogue: 20,
  audio_recording: 10,
  pronunciation: 10,
  story: 20,
  image: 5,
  labeled_image: 8,
  video: 30,
  document: 10,
};

const STATUS_MAP = {
  approve: "approved",
  reject: "rejected",
  request_changes: "needs_changes",
} as const;

export const POST = handle(async (request, context) => {
  const actor = await requireRoles(request, "reviewer", "admin", "super_admin");
  const { contributionId } = await context.params;
  const payload = await parseBody(request, reviewRequest);
  const id = uuidParam(contributionId, "contribution_id");

  const review = await prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.findUnique({ where: { id } });
    if (!contribution) {
      throw new ApiError(404, "Contribution not found");
    }
    if (!["submitted", "pending_review"].includes(contribution.status)) {
      throw new ApiError(
        409,
        `Contribution cannot be reviewed from status ${contribution.status}`,
      );
    }

    await tx.contribution.update({
      where: { id: contribution.id },
      data: { status: STATUS_MAP[payload.action], qualityScore: payload.quality_score },
    });
    if (contribution.promptItemId) {
      await tx.promptCompletion.updateMany({
        where: { contributionId: contribution.id },
        data: { status: STATUS_MAP[payload.action] },
      });
    }
    const created = await tx.review.create({
      data: {
        contributionId: contribution.id,
        reviewerId: actor.id,
        action: payload.action,
        notes: payload.notes,
        qualityScore: payload.quality_score,
      },
    });

    if (payload.action === "approve") {
      const alreadyAwarded = await tx.coinTransaction.findFirst({
        where: { contributionId: contribution.id, transactionType: "award" },
        select: { id: true },
      });
      if (!alreadyAwarded) {
        const amount = COIN_AWARDS[contribution.contributionType] ?? 5;
        const wallet = await userWallet(tx, contribution.authorId);
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            earnedCoins: { increment: amount },
            totalLifetimeCoins: { increment: amount },
          },
        });
        await tx.coinTransaction.create({
          data: {
            walletId: wallet.id,
            contributionId: contribution.id,
            amount,
            transactionType: "award",
            status: "completed",
            reason: `Approved ${contribution.contributionType}`,
            approvedBy: actor.id,
            createdAt: new Date(),
          },
        });
      }
    }
    return created;
  });

  return json(reviewRead(review), 201);
});
