import type { Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/server/auth";
import { validateTaxonomy } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { handle, json, parseBody } from "@/lib/server/http";
import { contributionCreate } from "@/lib/server/schemas";
import { contributionRead } from "@/lib/server/serializers";

export const GET = handle(async (request) => {
  const user = await getCurrentUser(request);
  const status = new URL(request.url).searchParams.get("status");
  const where: Prisma.ContributionWhereInput = { authorId: user.id };
  if (status) {
    where.status = status;
  }
  const contributions = await prisma.contribution.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return json(contributions.map(contributionRead));
});

export const POST = handle(async (request) => {
  const user = await getCurrentUser(request);
  const payload = await parseBody(request, contributionCreate);
  await validateTaxonomy(payload);
  const contribution = await prisma.contribution.create({
    data: {
      authorId: user.id,
      contributionType: payload.contribution_type,
      title: payload.title,
      description: payload.description,
      languageId: payload.language_id,
      dialectId: payload.dialect_id,
      targetLanguageId: payload.target_language_id,
      targetDialectId: payload.target_dialect_id,
      speechCommunityId: payload.speech_community_id,
      categoryId: payload.category_id,
      promptItemId: payload.source_prompt_id,
      domain: payload.domain,
      tags: payload.tags,
      source: payload.source,
      licenseType: payload.license_type,
      isSynthetic: payload.is_synthetic,
      status: "draft",
      version: 1,
      humanVerified: false,
    },
  });
  return json(contributionRead(contribution), 201);
});
