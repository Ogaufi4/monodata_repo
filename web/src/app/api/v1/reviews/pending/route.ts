import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { handle, json } from "@/lib/server/http";
import { contributionRead } from "@/lib/server/serializers";

export const GET = handle(async (request) => {
  await requireRoles(request, "reviewer", "admin", "super_admin");
  const contributions = await prisma.contribution.findMany({
    where: { status: "submitted" },
    orderBy: { submittedAt: "asc" },
  });
  return json(contributions.map(contributionRead));
});
