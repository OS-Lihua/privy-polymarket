import { prisma } from "@/lib/server/prisma";

async function main() {
  const attemptId = process.argv[2];
  if (!attemptId) {
    throw new Error("Usage: pnpm admin:mark-filled <attemptId>");
  }

  const attempt = await prisma.tradeAttempt.update({
    where: { id: attemptId },
    data: { status: "order_filled", feeRetainedAt: new Date() },
  });

  console.log(`Marked ${attempt.id} as order_filled`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
