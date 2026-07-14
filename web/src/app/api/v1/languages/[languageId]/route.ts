import type { Prisma } from "@prisma/client";

import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import {
  ApiError,
  createOrConflict,
  handle,
  json,
  parseBody,
  uuidParam,
} from "@/lib/server/http";
import { languageUpdate } from "@/lib/server/schemas";
import { languageRead } from "@/lib/server/serializers";

export const GET = handle(async (_request, context) => {
  const { languageId } = await context.params;
  const language = await prisma.language.findUnique({
    where: { id: uuidParam(languageId, "language_id") },
  });
  if (!language) {
    throw new ApiError(404, "Language not found");
  }
  return json(languageRead(language));
});

export const PATCH = handle(async (request, context) => {
  await requireRoles(request, "admin", "super_admin");
  const { languageId } = await context.params;
  const id = uuidParam(languageId, "language_id");
  const payload = await parseBody(request, languageUpdate);

  const language = await prisma.language.findUnique({ where: { id } });
  if (!language) {
    throw new ApiError(404, "Language not found");
  }
  if (
    payload.group_id &&
    !(await prisma.languageGroup.findUnique({ where: { id: payload.group_id } }))
  ) {
    throw new ApiError(422, "Unknown group_id");
  }

  // exclude_unset semantics: only keys present in the request are applied.
  const data: Prisma.LanguageUpdateInput = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.local_name !== undefined) data.localName = payload.local_name;
  if (payload.iso_code !== undefined) data.isoCode = payload.iso_code;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.group_id !== undefined) {
    data.group = payload.group_id
      ? { connect: { id: payload.group_id } }
      : { disconnect: true };
  }
  if (payload.is_active !== undefined && payload.is_active !== null) {
    data.isActive = payload.is_active;
  }

  const updated = await createOrConflict(
    () => prisma.language.update({ where: { id }, data }),
    "This language already exists in the selected group",
  );
  return json(languageRead(updated));
});
