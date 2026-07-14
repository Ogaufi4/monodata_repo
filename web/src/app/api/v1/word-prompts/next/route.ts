import { getCurrentUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { ApiError, handle, json, uuidParam } from "@/lib/server/http";
import { promptItemRead } from "@/lib/server/serializers";

const COUNTED_STATUSES = new Set(["submitted", "approved"]);
const TASKS = new Set(["translation", "pronunciation", "conversation"]);

function intQuery(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const GET = handle(async (request) => {
  const user = await getCurrentUser(request);
  const searchParams = new URL(request.url).searchParams;
  const languageId = uuidParam(searchParams.get("language_id") ?? "", "language_id");
  const taskType = searchParams.get("task_type") ?? "translation";
  if (!TASKS.has(taskType)) {
    throw new ApiError(422, "task_type must be translation or pronunciation");
  }

  const language = await prisma.language.findUnique({
    where: { id: languageId },
    select: { id: true },
  });
  if (!language) {
    throw new ApiError(422, "Unknown language_id");
  }

  const requestedMaxRepeats = intQuery(searchParams.get("max_repeats"), 3);
  const domain = searchParams.get("domain");
  const difficulty = searchParams.get("difficulty");

  const prompts = await prisma.promptItem.findMany({
    where: {
      isActive: true,
      promptType: taskType,
      ...(domain ? { domain } : {}),
      ...(difficulty ? { difficulty } : {}),
    },
    include: {
      completions: {
        where: { languageId, taskType },
        select: { status: true, userId: true },
      },
    },
    orderBy: [{ difficulty: "asc" }, { sourceText: "asc" }],
    take: 500,
  });

  const candidates = prompts
    .map((prompt) => {
      const completed = prompt.completions.filter((completion) =>
        COUNTED_STATUSES.has(completion.status),
      ).length;
      const limit = Math.min(prompt.maxRepeats, requestedMaxRepeats);
      const alreadyDoneByUser = prompt.completions.some(
        (completion) => completion.userId === user.id && completion.status !== "rejected",
      );
      return { prompt, completed, limit, alreadyDoneByUser };
    })
    .filter((candidate) => candidate.completed < candidate.limit && !candidate.alreadyDoneByUser);

  if (candidates.length === 0) {
    return json({ prompt: null, detail: "No available prompts for this language and task." });
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return json({
    prompt: promptItemRead(selected.prompt, {
      completed: selected.completed,
      remaining: selected.limit - selected.completed,
    }),
  });
});
