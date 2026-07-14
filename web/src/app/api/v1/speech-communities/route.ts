import type { Prisma } from "@prisma/client";

import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, boolQuery, handle, json, parseBody, uuidParam } from "@/lib/server/http";
import { speechCommunityCreate } from "@/lib/server/schemas";
import { speechCommunityRead } from "@/lib/server/serializers";

export const dynamic = "force-dynamic";

export const GET = handle(async (request) => {
  const searchParams = new URL(request.url).searchParams;
  const where: Prisma.SpeechCommunityWhereInput = {};
  const languageId = searchParams.get("language_id");
  if (languageId) {
    where.languageId = uuidParam(languageId, "language_id");
  }
  const district = searchParams.get("district");
  if (district) {
    if (district.length > 120) {
      throw new ApiError(422, "district must be at most 120 characters");
    }
    where.district = district;
  }
  if (!boolQuery(searchParams.get("include_archived"))) {
    where.isActive = true;
  }
  const communities = await prisma.speechCommunity.findMany({ where, orderBy: { name: "asc" } });
  return json(communities.map(speechCommunityRead));
});

export const POST = handle(async (request) => {
  await requireRoles(request, "admin", "super_admin");
  const payload = await parseBody(request, speechCommunityCreate);
  if (
    payload.language_id &&
    !(await prisma.language.findUnique({ where: { id: payload.language_id } }))
  ) {
    throw new ApiError(422, "Unknown language_id");
  }
  if (payload.dialect_id) {
    const dialect = await prisma.dialect.findUnique({ where: { id: payload.dialect_id } });
    if (!dialect || dialect.languageId !== payload.language_id) {
      throw new ApiError(422, "dialect_id does not belong to language_id");
    }
  }
  const community = await prisma.speechCommunity.create({
    data: {
      name: payload.name,
      description: payload.description,
      isActive: payload.is_active,
      district: payload.district,
      village: payload.village,
      languageId: payload.language_id,
      dialectId: payload.dialect_id,
    },
  });
  return json(speechCommunityRead(community), 201);
});
