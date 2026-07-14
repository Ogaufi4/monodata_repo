import { env } from "@/lib/server/env";
import { handle, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  return json({ status: "ok", service: env.appName, environment: env.environment });
});
