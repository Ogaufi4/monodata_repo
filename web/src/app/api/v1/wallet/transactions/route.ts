import { getCurrentUser } from "@/lib/server/auth";
import { userWallet } from "@/lib/server/contributions";
import { prisma } from "@/lib/server/db";
import { handle, json } from "@/lib/server/http";
import { coinTransactionRead } from "@/lib/server/serializers";

export const GET = handle(async (request) => {
  const user = await getCurrentUser(request);
  const wallet = await userWallet(prisma, user.id);
  const transactions = await prisma.coinTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
  });
  return json(transactions.map(coinTransactionRead));
});
