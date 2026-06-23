import { prisma } from "@/lib/server/prisma";
import { TERMINAL_ATTEMPT_STATUSES } from "@/lib/server/config";

async function main() {
  const attempts = await prisma.tradeAttempt.findMany({
    where: {
      NOT: { status: { in: [...TERMINAL_ATTEMPT_STATUSES] } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  console.table(
    attempts.map((attempt) => ({
      id: attempt.id,
      status: attempt.status,
      depositWalletAddress: attempt.depositWalletAddress,
      feeTxHash: attempt.feeTxHash,
      refundErrorMessage: attempt.refundErrorMessage,
      updatedAt: attempt.updatedAt.toISOString(),
    }))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
