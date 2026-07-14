import type { Prisma } from "@prisma/client";

import type { AuthenticatedUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

type UserWithRoles = Prisma.UserGetPayload<{
  include: { userRoles: { include: { role: true } } };
}>;

export function toAuthenticatedUser(user: UserWithRoles): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    roles: user.userRoles.map((userRole) => userRole.role.name),
  };
}

/** Find-or-create the contributor role, like contributor_role in auth.py. */
export async function contributorRoleId(): Promise<string> {
  const existing = await prisma.role.findUnique({ where: { name: "contributor" } });
  if (existing) return existing.id;
  const created = await prisma.role.create({
    data: { name: "contributor", description: "Submits data contributions" },
  });
  return created.id;
}
