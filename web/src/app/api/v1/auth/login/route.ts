import { createAccessToken, verifyPassword } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { loginRequest } from "@/lib/server/schemas";
import { tokenResponse } from "@/lib/server/serializers";
import { toAuthenticatedUser } from "../shared";

export const POST = handle(async (request) => {
  const payload = await parseBody(request, loginRequest);
  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) {
    throw new ApiError(403, "Account is inactive");
  }
  return json(tokenResponse(await createAccessToken(user.id), toAuthenticatedUser(user)));
});
