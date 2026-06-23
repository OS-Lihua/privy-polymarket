import { NextRequest, NextResponse } from "next/server";
import { BLOCKING_ATTEMPT_STATUSES } from "@/lib/server/config";
import { requirePrivyAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { serializeAttempt } from "@/lib/server/serialize";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePrivyAuth(request);
    const depositWalletAddress =
      request.nextUrl.searchParams.get("depositWalletAddress") ||
      request.nextUrl.searchParams.get("safeAddress");

    const attempt = await prisma.tradeAttempt.findFirst({
      where: {
        privyUserId: auth.privyUserId,
        ...(depositWalletAddress
          ? { depositWalletAddress }
          : {}),
        status: { in: [...BLOCKING_ATTEMPT_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attempt: attempt ? serializeAttempt(attempt) : null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch active attempt" },
      { status: 400 }
    );
  }
}
