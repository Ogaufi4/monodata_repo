import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { handle, json } from "@/lib/server/http";
import { datasetExportRead } from "@/lib/server/serializers";

export const GET = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");
  const exports = await prisma.datasetExport.findMany({ orderBy: { createdAt: "desc" } });
  return json(exports.map(datasetExportRead));
});
