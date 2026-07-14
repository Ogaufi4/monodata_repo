import type { Contribution, Prisma, PrismaClient, Wallet } from "@prisma/client";

import type { AuthenticatedUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/http";
import type { contributionCreate } from "@/lib/server/schemas";
import type { z } from "zod";

const PRIVILEGED_ROLES = ["reviewer", "admin", "super_admin"];

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Mirrors owned_contribution in api/app/api/routes/contributions.py:
 * 404 when missing, 403 unless the user is the author or holds a
 * reviewer/admin/super_admin role.
 */
export async function ownedContribution<Include extends Prisma.ContributionInclude | undefined>(
  contributionId: string,
  user: AuthenticatedUser,
  include?: Include,
  client: Client = prisma,
): Promise<Prisma.ContributionGetPayload<{ include: Include }>> {
  const contribution = await client.contribution.findUnique({
    where: { id: contributionId },
    include,
  });
  if (!contribution) {
    throw new ApiError(404, "Contribution not found");
  }
  if (
    contribution.authorId !== user.id &&
    !user.roles.some((role) => PRIVILEGED_ROLES.includes(role))
  ) {
    throw new ApiError(403, "Contribution access denied");
  }
  return contribution as Prisma.ContributionGetPayload<{ include: Include }>;
}

export function assertAuthor(contribution: Contribution, user: AuthenticatedUser, detail: string): void {
  if (contribution.authorId !== user.id) {
    throw new ApiError(403, detail);
  }
}

// Which prompt pool each contribution type may draw from. Keep in sync with
// PROMPT_TASK_BY_TYPE in the submit route.
const PROMPT_TYPE_BY_CONTRIBUTION: Record<string, string> = {
  translation: "translation",
  conversation: "conversation",
  dialogue: "conversation",
  audio_recording: "pronunciation",
  pronunciation: "pronunciation",
};

export async function validateTaxonomy(payload: z.infer<typeof contributionCreate>): Promise<void> {
  if (!(await prisma.language.findUnique({ where: { id: payload.language_id } }))) {
    throw new ApiError(422, "Unknown language_id");
  }
  if (!(await prisma.category.findUnique({ where: { id: payload.category_id } }))) {
    throw new ApiError(422, "Unknown category_id");
  }
  if (payload.source_prompt_id) {
    const prompt = await prisma.promptItem.findUnique({
      where: { id: payload.source_prompt_id },
      select: { promptType: true, isActive: true },
    });
    if (!prompt || !prompt.isActive) {
      throw new ApiError(422, "Unknown source_prompt_id");
    }
    const expectedPromptType = PROMPT_TYPE_BY_CONTRIBUTION[payload.contribution_type] ?? null;
    if (!expectedPromptType || prompt.promptType !== expectedPromptType) {
      throw new ApiError(422, "source_prompt_id does not match contribution_type");
    }
  }
  if (
    payload.target_language_id &&
    !(await prisma.language.findUnique({ where: { id: payload.target_language_id } }))
  ) {
    throw new ApiError(422, "Unknown target_language_id");
  }
  const dialectChecks: Array<[string | null, string | null, string]> = [
    [payload.dialect_id, payload.language_id, "dialect_id"],
    [payload.target_dialect_id, payload.target_language_id, "target_dialect_id"],
  ];
  for (const [dialectId, languageId, field] of dialectChecks) {
    if (!dialectId) continue;
    const dialect = await prisma.dialect.findUnique({ where: { id: dialectId } });
    if (!dialect || dialect.languageId !== languageId) {
      throw new ApiError(422, `${field} does not belong to its selected language`);
    }
  }
  if (
    payload.speech_community_id &&
    !(await prisma.speechCommunity.findUnique({ where: { id: payload.speech_community_id } }))
  ) {
    throw new ApiError(422, "Unknown speech_community_id");
  }
}

/** Find-or-create the user's wallet, like user_wallet in workflow.py. */
export async function userWallet(client: Client, userId: string): Promise<Wallet> {
  const existing = await client.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return client.wallet.create({
    data: {
      userId,
      pendingCoins: 0,
      earnedCoins: 0,
      redeemedCoins: 0,
      expiredCoins: 0,
      totalLifetimeCoins: 0,
    },
  });
}
