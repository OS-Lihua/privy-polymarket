import { prisma } from "@/lib/server/prisma";

async function main() {
  const attempts = await prisma.tradeAttempt.findMany({
    where: { status: { in: ["order_failed_refund_pending", "refund_pending"] } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  console.table(
    attempts.map((attempt) => ({
      id: attempt.id,
      safeAddress: attempt.safeAddress,
      feeAmountUsdcMicros: attempt.feeAmountUsdcMicros.toString(),
      feeTxHash: attempt.feeTxHash,
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
