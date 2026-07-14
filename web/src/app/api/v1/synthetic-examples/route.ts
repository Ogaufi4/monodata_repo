import type { Prisma } from "@prisma/client";

import { requireRoles } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { syntheticExampleCreate } from "@/lib/server/schemas";
import { syntheticExampleRead } from "@/lib/server/serializers";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const examples = await prisma.syntheticExample.findMany({ orderBy: { createdAt: "desc" } });
  return json(examples.map(syntheticExampleRead));
});

export const POST = handle(async (request) => {
  const user = await requireRoles(request, "admin", "super_admin");
  const payload = await parseBody(request, syntheticExampleCreate);

  if (
    payload.language_id &&
    !(await prisma.language.findUnique({ where: { id: payload.language_id } }))
  ) {
    throw new ApiError(422, "Unknown language_id");
  }

  const example = await prisma.syntheticExample.create({
    data: {
      title: payload.title,
      exampleType: payload.example_type,
      content: payload.content as Prisma.InputJsonValue,
      languageId: payload.language_id,
      syntheticSourceModel: payload.synthetic_source_model,
      promptUsed: payload.prompt_used,
      generatedAt: new Date(),
      humanVerified: false,
      reviewStatus: "pending_review",
      createdBy: user.id,
    },
  });
  return json(syntheticExampleRead(example), 201);
});
