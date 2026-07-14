import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { handle, json } from "@/lib/server/http";

export const GET = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");

  const [
    totalContributors,
    totalContributions,
    statusGroups,
    languagesCovered,
    imageLabels,
    syntheticExamples,
    coinsAwarded,
    datasetExports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.contribution.count(),
    prisma.contribution.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contribution.findMany({ distinct: ["languageId"], select: { languageId: true } }),
    prisma.imageAnnotation.count(),
    prisma.syntheticExample.count(),
    prisma.coinTransaction.aggregate({ _sum: { amount: true } }),
    prisma.datasetExport.count(),
  ]);

  const statusCounts = Object.fromEntries(
    statusGroups.map((group) => [group.status, group._count._all]),
  );

  return json({
    total_contributors: totalContributors,
    total_contributions: totalContributions,
    approved_contributions: statusCounts["approved"] ?? 0,
    pending_reviews: statusCounts["submitted"] ?? 0,
    rejected_submissions: statusCounts["rejected"] ?? 0,
    languages_covered: languagesCovered.length,
    image_labels_created: imageLabels,
    synthetic_examples_created: syntheticExamples,
    coins_awarded: coinsAwarded._sum.amount ?? 0,
    dataset_exports_created: datasetExports,
  });
});
