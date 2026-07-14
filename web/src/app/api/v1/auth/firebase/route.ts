import { createRemoteJWKSet, jwtVerify } from "jose";

import { createAccessToken, hashPassword } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { ApiError, handle, json, parseBody } from "@/lib/server/http";
import { firebaseLoginRequest } from "@/lib/server/schemas";
import { tokenResponse } from "@/lib/server/serializers";
import { contributorRoleId, toAuthenticatedUser } from "../shared";

// Google's public signing keys for Firebase ID tokens (JWK form of the certs
// used by google.oauth2.id_token.verify_firebase_token).
const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function verifyFirebaseToken(idToken: string, projectId: string) {
  jwks ??= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload as Record<string, unknown>;
}

export const POST = handle(async (request) => {
  const payload = await parseBody(request, firebaseLoginRequest);
  if (!env.firebaseProjectId) {
    throw new ApiError(503, "Firebase authentication is not configured");
  }

  let decoded: Record<string, unknown>;
  try {
    decoded = await verifyFirebaseToken(payload.id_token, env.firebaseProjectId);
  } catch {
    throw new ApiError(401, "Invalid Firebase token");
  }

  const email = String(decoded.email ?? "").toLowerCase();
  if (!email) {
    throw new ApiError(400, "Firebase account has no email");
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user) {
    const fullName = payload.full_name || (decoded.name as string | undefined) || email.split("@")[0];
    const roleId = await contributorRoleId();
    user = await prisma.user.create({
      data: {
        email,
        fullName: String(fullName).trim().slice(0, 160) || email,
        passwordHash: await hashPassword(`firebase:${decoded.user_id ?? decoded.sub ?? email}`),
        isActive: true,
        userRoles: { create: [{ roleId }] },
      },
      include: { userRoles: { include: { role: true } } },
    });
  } else if (!user.isActive) {
    throw new ApiError(403, "Account is inactive");
  }

  return json(tokenResponse(await createAccessToken(user.id), toAuthenticatedUser(user)));
});
