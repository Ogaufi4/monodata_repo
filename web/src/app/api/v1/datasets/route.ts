import type { Prisma } from "@prisma/client";

import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { handle, json, parseBody } from "@/lib/server/http";
import { datasetCreate } from "@/lib/server/schemas";
import { datasetRead } from "@/lib/server/serializers";

export const POST = handle(async (request) => {
  const user = await requireRoles(request, "admin", "super_admin");
  const payload = await parseBody(request, datasetCreate);

  // Filters snapshot everything except name/description, nulls included,
  // matching Dataset.filters produced by the FastAPI endpoint.
  const filters = {
    language_id: payload.language_id,
    contribution_type: payload.contribution_type,
    minimum_quality_score: payload.minimum_quality_score,
    include_synthetic: payload.include_synthetic,
  };

  const where: Prisma.ContributionWhereInput = { status: "approved" };
  if (payload.language_id) {
    where.languageId = payload.language_id;
  }
  if (payload.contribution_type) {
    where.contributionType = payload.contribution_type;
  }
  if (payload.minimum_quality_score !== null) {
    where.qualityScore = { gte: payload.minimum_quality_score };
  }
  if (!payload.include_synthetic) {
    where.isSynthetic = false;
  }

  const dataset = await prisma.$transaction(async (tx) => {
    const created = await tx.dataset.create({
      data: {
        name: payload.name,
        description: payload.description,
        filters,
        createdBy: user.id,
      },
    });
    const contributions = await tx.contribution.findMany({ where, select: { id: true } });
    if (contributions.length > 0) {
      await tx.datasetItem.createMany({
        data: contributions.map((contribution) => ({
          datasetId: created.id,
          contributionId: contribution.id,
        })),
      });
    }
    return created;
  });
  return json(datasetRead(dataset), 201);
});

export const GET = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");
  const datasets = await prisma.dataset.findMany({ orderBy: { createdAt: "desc" } });
  return json(datasets.map(datasetRead));
});
