import { prisma } from "@/lib/server/prisma";

async function main() {
  const attemptId = process.argv[2];
  if (!attemptId) {
    throw new Error("Usage: pnpm admin:cancel-attempt <attemptId>");
  }

  const attempt = await prisma.tradeAttempt.update({
    where: { id: attemptId },
    data: {
      status: "cancelled",
      errorMessage: "Cancelled by admin",
    },
  });

  console.log(`Cancelled ${attempt.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
