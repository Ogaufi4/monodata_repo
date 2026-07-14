import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { ZodType } from "zod";

/** Mirrors FastAPI's HTTPException: responses are `{"detail": ...}`. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(422, "Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const location = issue.path.length ? issue.path.join(".") : "body";
    throw new ApiError(422, `${location}: ${issue.message}`);
  }
  return result.data;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** FastAPI rejects malformed UUID path params with 422 before the handler runs. */
export function uuidParam(value: string, name: string): string {
  if (!UUID_PATTERN.test(value)) {
    throw new ApiError(422, `${name} must be a valid UUID`);
  }
  return value.toLowerCase();
}

export function boolQuery(value: string | null): boolean {
  return value !== null && ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

/** Converts a Prisma unique-constraint violation into a 409, like commit_or_conflict. */
export async function createOrConflict<T>(action: () => Promise<T>, detail: string): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, detail);
    }
    throw error;
  }
}

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (request: Request, context: RouteContext) => Promise<Response>;

export function handle(handler: Handler): Handler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ detail: error.detail }, { status: error.status });
      }
      if (error instanceof Prisma.PrismaClientInitializationError) {
        return NextResponse.json(
          { detail: "Database connection failed. Check DATABASE_URL and network access." },
          { status: 503 },
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
        return NextResponse.json(
          { detail: "Database schema is not ready. Run Prisma migrations before using this API." },
          { status: 503 },
        );
      }
      console.error(error);
      return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
  };
}
