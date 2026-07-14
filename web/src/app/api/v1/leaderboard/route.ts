import { prisma } from "@/lib/server/db";
import { handle, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const wallets = await prisma.wallet.findMany({
    where: { totalLifetimeCoins: { gt: 0 } },
    orderBy: { totalLifetimeCoins: "desc" },
    take: 50,
    include: { user: { select: { fullName: true } } },
  });
  return json(
    wallets.map((wallet, index) => ({
      rank: index + 1,
      full_name: wallet.user.fullName,
      coins: wallet.totalLifetimeCoins,
    })),
  );
});
