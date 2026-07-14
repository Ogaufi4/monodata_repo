import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, uuidParam } from "@/lib/server/http";

export const GET = handle(async (request, context) => {
  await requireRoles(request, "admin", "super_admin");
  const { exportId } = await context.params;
  const id = uuidParam(exportId, "export_id");

  const datasetExport = await prisma.datasetExport.findUnique({ where: { id } });
  if (!datasetExport) {
    throw new ApiError(404, "Export not found");
  }

  const contributions = await prisma.contribution.findMany({
    where: { datasetItems: { some: { datasetId: datasetExport.datasetId } } },
    orderBy: { createdAt: "asc" },
  });

  const lines = contributions.map((item) =>
    JSON.stringify({
      contribution_id: item.id,
      type: item.contributionType,
      title: item.title,
      description: item.description,
      language_id: item.languageId,
      target_language_id: item.targetLanguageId,
      quality_score: item.qualityScore,
      is_synthetic: item.isSynthetic,
      human_verified: item.humanVerified,
      license_type: item.licenseType,
    }),
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="dataset-${datasetExport.id}.jsonl"`,
    },
  });
});
