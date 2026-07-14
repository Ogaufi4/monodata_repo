import { getCurrentUser } from "@/lib/server/auth";
import { handle, json } from "@/lib/server/http";
import { userResponse } from "@/lib/server/serializers";

export const GET = handle(async (request) => {
  const user = await getCurrentUser(request);
  return json(userResponse(user));
});
