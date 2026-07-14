import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { createOrConflict, handle, json, parseBody } from "@/lib/server/http";
import { categoryCreate } from "@/lib/server/schemas";
import { categoryRead } from "@/lib/server/serializers";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return json(categories.map(categoryRead));
});

export const POST = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");
  const payload = await parseBody(request, categoryCreate);
  const category = await createOrConflict(
    () =>
      prisma.category.create({
        data: { name: payload.name, description: payload.description, isActive: true },
      }),
    "Category already exists",
  );
  return json(categoryRead(category), 201);
});
