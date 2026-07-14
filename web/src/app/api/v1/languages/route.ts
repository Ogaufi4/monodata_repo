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
import { languageCreate } from "@/lib/server/schemas";
import { languageRead } from "@/lib/server/serializers";

export const dynamic = "force-dynamic";

export const GET = handle(async (request) => {
  const searchParams = new URL(request.url).searchParams;
  const where: Prisma.LanguageWhereInput = {};
  const groupId = searchParams.get("group_id");
  if (groupId) {
    where.groupId = uuidParam(groupId, "group_id");
  }
  if (!boolQuery(searchParams.get("include_archived"))) {
    where.isActive = true;
  }
  const languages = await prisma.language.findMany({ where, orderBy: { name: "asc" } });
  return json(languages.map(languageRead));
});

export const POST = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");
  const payload = await parseBody(request, languageCreate);
  if (
    payload.group_id &&
    !(await prisma.languageGroup.findUnique({ where: { id: payload.group_id } }))
  ) {
    throw new ApiError(422, "Unknown group_id");
  }
  const language = await createOrConflict(
    () =>
      prisma.language.create({
        data: {
          name: payload.name,
          description: payload.description,
          isActive: payload.is_active,
          localName: payload.local_name,
          isoCode: payload.iso_code,
          groupId: payload.group_id,
        },
      }),
    "This language already exists in the selected group",
  );
  return json(languageRead(language), 201);
});
