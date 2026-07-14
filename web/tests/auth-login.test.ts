import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/db", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as me } from "@/app/api/v1/auth/me/route";
import { createAccessToken, hashPassword, verifyToken } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

const findUnique = vi.mocked(prisma.user.findUnique);

const USER_ID = "3f8b6a3e-9f1a-4d2b-8c3d-1a2b3c4d5e6f";
const PASSWORD = "a-secure-test-password";
const context = { params: Promise.resolve({}) };

type TestUser = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  passwordHash: string;
  userRoles: { role: { name: string } }[];
};

let testUser: TestUser;

beforeAll(async () => {
  testUser = {
    id: USER_ID,
    email: "contributor@example.com",
    fullName: "Test Contributor",
    isActive: true,
    passwordHash: await hashPassword(PASSWORD),
    userRoles: [{ role: { name: "contributor" } }],
  };
});

beforeEach(() => {
  findUnique.mockReset();
});

function postLogin(body: unknown): Promise<Response> {
  return login(
    new Request("http://test.local/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    context,
  );
}

function getMe(headers: Record<string, string> = {}): Promise<Response> {
  return me(new Request("http://test.local/api/v1/auth/me", { headers }), context);
}

describe("POST /api/v1/auth/login", () => {
  it("returns a bearer token and snake_case user for valid credentials", async () => {
    findUnique.mockResolvedValue(testUser as never);

    const response = await postLogin({ email: testUser.email, password: PASSWORD });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.token_type).toBe("bearer");
    expect(body.user).toEqual({
      id: USER_ID,
      email: "contributor@example.com",
      full_name: "Test Contributor",
      is_active: true,
      roles: ["contributor"],
    });

    const claims = await verifyToken(body.access_token);
    expect(claims.sub).toBe(USER_ID);
  });

  it("looks the user up by lowercased email", async () => {
    findUnique.mockResolvedValue(testUser as never);

    const response = await postLogin({ email: "CONTRIBUTOR@Example.COM", password: PASSWORD });
    expect(response.status).toBe(200);
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "contributor@example.com" } }),
    );
  });

  it("rejects a wrong password with 401", async () => {
    findUnique.mockResolvedValue(testUser as never);

    const response = await postLogin({ email: testUser.email, password: "not-the-password" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: "Invalid email or password" });
  });

  it("rejects an unknown email with the same 401 as a wrong password", async () => {
    findUnique.mockResolvedValue(null as never);

    const response = await postLogin({ email: "nobody@example.com", password: PASSWORD });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: "Invalid email or password" });
  });

  it("rejects an inactive account with 403 only after the password check", async () => {
    findUnique.mockResolvedValue({ ...testUser, isActive: false } as never);

    const response = await postLogin({ email: testUser.email, password: PASSWORD });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ detail: "Account is inactive" });

    const wrongPassword = await postLogin({ email: testUser.email, password: "wrong" });
    expect(wrongPassword.status).toBe(401);
  });

  it("rejects a malformed email with 422 before touching the database", async () => {
    const response = await postLogin({ email: "not-an-email", password: PASSWORD });
    expect(response.status).toBe(422);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON body with 422", async () => {
    const response = await postLogin("this is not json");
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ detail: "Request body must be valid JSON" });
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns the authenticated user for a valid bearer token", async () => {
    findUnique.mockResolvedValue(testUser as never);
    const token = await createAccessToken(USER_ID);

    const response = await getMe({ authorization: `Bearer ${token}` });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.email).toBe("contributor@example.com");
    expect(body.roles).toEqual(["contributor"]);
  });

  it("rejects a missing Authorization header with 401", async () => {
    const response = await getMe();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: "Authentication required" });
  });

  it("rejects a garbage token with 401", async () => {
    const response = await getMe({ authorization: "Bearer not-a-jwt" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: "Invalid or expired token" });
  });

  it("rejects a valid token whose user is inactive with 401", async () => {
    findUnique.mockResolvedValue({ ...testUser, isActive: false } as never);
    const token = await createAccessToken(USER_ID);

    const response = await getMe({ authorization: `Bearer ${token}` });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ detail: "Inactive or unknown user" });
  });

  it("rejects a token without a UUID subject with 401 before touching the database", async () => {
    findUnique.mockResolvedValue(testUser as never);
    const token = await createAccessToken("not-a-uuid");

    const response = await getMe({ authorization: `Bearer ${token}` });
    expect(response.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
