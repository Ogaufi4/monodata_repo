import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { datasetExportRead } from "@/lib/server/serializers";

export const POST = handle(async (request, context) => {
  const user = await requireRoles(request, "admin", "super_admin");
  const { datasetId } = await context.params;
  const id = uuidParam(datasetId, "dataset_id");

  const dataset = await prisma.dataset.findUnique({ where: { id } });
  if (!dataset) {
    throw new ApiError(404, "Dataset not found");
  }
  const count = await prisma.datasetItem.count({ where: { datasetId: dataset.id } });

  const datasetExport = await prisma.datasetExport.create({
    data: {
      datasetId: dataset.id,
      exportFormat: "jsonl",
      status: "ready",
      itemCount: count,
      manifest: {
        dataset_id: dataset.id,
        name: dataset.name,
        filters: dataset.filters,
        generated_at: new Date().toISOString(),
        human_and_synthetic_separated: true,
      },
      createdBy: user.id,
    },
  });
  return json(datasetExportRead(datasetExport), 201);
});
