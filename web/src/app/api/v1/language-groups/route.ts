import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { boolQuery, createOrConflict, handle, json, parseBody } from "@/lib/server/http";
import { languageGroupCreate } from "@/lib/server/schemas";
import { languageGroupRead } from "@/lib/server/serializers";

export const dynamic = "force-dynamic";

export const GET = handle(async (request) => {
  const includeArchived = boolQuery(new URL(request.url).searchParams.get("include_archived"));
  const groups = await prisma.languageGroup.findMany({
    where: includeArchived ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
  return json(groups.map(languageGroupRead));
});

export const POST = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");
  const payload = await parseBody(request, languageGroupCreate);
  const group = await createOrConflict(
    () =>
      prisma.languageGroup.create({
        data: {
          name: payload.name,
          description: payload.description,
          isActive: payload.is_active,
        },
      }),
    "A language group with this name already exists",
  );
  return json(languageGroupRead(group), 201);
});
