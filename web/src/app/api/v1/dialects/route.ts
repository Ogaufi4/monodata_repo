import type { Prisma } from "@prisma/client";

import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import {
  ApiError,
  boolQuery,
  createOrConflict,
  handle,
  json,
  parseBody,
  uuidParam,
} from "@/lib/server/http";
import { dialectCreate } from "@/lib/server/schemas";
import { dialectRead } from "@/lib/server/serializers";

export const dynamic = "force-dynamic";

export const GET = handle(async (request) => {
  const searchParams = new URL(request.url).searchParams;
  const where: Prisma.DialectWhereInput = {};
  const languageId = searchParams.get("language_id");
  if (languageId) {
    where.languageId = uuidParam(languageId, "language_id");
  }
  if (!boolQuery(searchParams.get("include_archived"))) {
    where.isActive = true;
  }
  const dialects = await prisma.dialect.findMany({ where, orderBy: { name: "asc" } });
  return json(dialects.map(dialectRead));
});

export const POST = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");
  const payload = await parseBody(request, dialectCreate);
  if (!(await prisma.language.findUnique({ where: { id: payload.language_id } }))) {
    throw new ApiError(422, "Unknown language_id");
  }
  const dialect = await createOrConflict(
    () =>
      prisma.dialect.create({
        data: {
          name: payload.name,
          description: payload.description,
          isActive: payload.is_active,
          languageId: payload.language_id,
          localName: payload.local_name,
        },
      }),
    "This dialect already exists for the selected language",
  );
  return json(dialectRead(dialect), 201);
});
