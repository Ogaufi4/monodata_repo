import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { syntheticExampleRead } from "@/lib/server/serializers";

export const PATCH = handle(async (request, context) => {
  await requireRoles(request, "reviewer", "admin", "super_admin");
  const { exampleId } = await context.params;
  const id = uuidParam(exampleId, "example_id");

  const example = await prisma.syntheticExample.findUnique({ where: { id } });
  if (!example) {
    throw new ApiError(404, "Synthetic example not found");
  }
  const updated = await prisma.syntheticExample.update({
    where: { id },
    data: { humanVerified: true, reviewStatus: "approved" },
  });
  return json(syntheticExampleRead(updated));
});
