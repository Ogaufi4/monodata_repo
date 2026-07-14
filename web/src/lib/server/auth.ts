import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { ApiError } from "@/lib/server/http";

const JWT_ALGORITHM = "HS256";
const jwtSecret = new TextEncoder().encode(env.jwtSecret);

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
};

// pwdlib's PasswordHash.recommended() produces argon2id hashes, which
// @node-rs/argon2 verifies and generates natively.
export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password);
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  try {
    return await argon2Verify(encoded, password);
  } catch {
    return false;
  }
}

export async function createAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${env.accessTokenMinutes}m`)
    .sign(jwtSecret);
}

export async function signToken(claims: Record<string, unknown>, expiresInSeconds: number): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(jwtSecret);
}

export async function verifyToken(token: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, jwtSecret, { algorithms: [JWT_ALGORITHM] });
  return payload as Record<string, unknown>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCurrentUser(request: Request): Promise<AuthenticatedUser> {
  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    throw new ApiError(401, "Authentication required");
  }
  const token = header.slice("bearer ".length).trim();

  let userId: string;
  try {
    const payload = await verifyToken(token);
    if (typeof payload.sub !== "string" || !UUID_PATTERN.test(payload.sub)) {
      throw new Error("invalid subject");
    }
    userId = payload.sub.toLowerCase();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user || !user.isActive) {
    throw new ApiError(401, "Inactive or unknown user");
  }
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    roles: user.userRoles.map((userRole) => userRole.role.name),
  };
}

export async function requireRoles(request: Request, ...allowed: string[]): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(request);
  if (!user.roles.some((role) => allowed.includes(role))) {
    throw new ApiError(403, "Insufficient permissions");
  }
  return user;
}
