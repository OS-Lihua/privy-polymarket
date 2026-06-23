import { prisma } from "@/lib/server/prisma";

async function main() {
  const attemptId = process.argv[2];
  if (!attemptId) {
    throw new Error("Usage: pnpm admin:refund <attemptId>");
  }

  const attempt = await prisma.tradeAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) {
    throw new Error(`Attempt not found: ${attemptId}`);
  }

  await prisma.tradeAttempt.update({
    where: { id: attemptId },
    data: {
      status: "refund_pending",
      errorMessage:
        "Refund requested by admin. Submit refund from platform wallet, then record refundTxHash in the database.",
    },
  });

  console.log(
    `Refund pending for ${attempt.id}: send ${attempt.feeAmountUsdcMicros.toString()} micro-USDC to ${attempt.depositWalletAddress}`
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
