import { createAccessToken, hashPassword } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { registerRequest } from "@/lib/server/schemas";
import { tokenResponse } from "@/lib/server/serializers";
import { contributorRoleId, toAuthenticatedUser } from "../shared";

export const POST = handle(async (request) => {
  const payload = await parseBody(request, registerRequest);
  const email = payload.email.toLowerCase();

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new ApiError(409, "Email is already registered");
  }

  const roleId = await contributorRoleId();
  const user = await prisma.user.create({
    data: {
      email,
      fullName: payload.full_name.trim(),
      passwordHash: await hashPassword(payload.password),
      isActive: true,
      userRoles: { create: [{ roleId }] },
    },
    include: { userRoles: { include: { role: true } } },
  });

  const authenticated = toAuthenticatedUser(user);
  return json(tokenResponse(await createAccessToken(user.id), authenticated), 201);
});
