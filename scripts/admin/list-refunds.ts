import { prisma } from "@/lib/server/prisma";

async function main() {
  const attempts = await prisma.tradeAttempt.findMany({
    where: {
      status: {
        in: [
          "order_failed_refund_pending",
          "refund_pending",
          "refund_pending_review",
          "refund_too_small_review",
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  console.table(
    attempts.map((attempt) => ({
      id: attempt.id,
      depositWalletAddress: attempt.depositWalletAddress,
      feeAmountUsdcMicros: attempt.feeAmountUsdcMicros.toString(),
      refundNetUsdcMicros: attempt.refundNetUsdcMicros?.toString(),
      refundErrorMessage: attempt.refundErrorMessage,
      feeTxHash: attempt.feeTxHash,
      updatedAt: attempt.updatedAt.toISOString(),
    })),
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
