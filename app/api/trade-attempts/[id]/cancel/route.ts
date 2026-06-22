import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/server/auth";
import { canCancelAttempt } from "@/lib/server/trade-attempts";
import { prisma } from "@/lib/server/prisma";
import { serializeAttempt } from "@/lib/server/serialize";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePrivyAuth(request);
    const { id } = await params;
    const attempt = await prisma.tradeAttempt.findUnique({ where: { id } });

    if (!attempt || attempt.privyUserId !== auth.privyUserId) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (!canCancelAttempt(attempt)) {
      return NextResponse.json(
        { error: "Attempt cannot be cancelled after fee submission" },
        { status: 400 }
      );
    }

    const updated = await prisma.tradeAttempt.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ attempt: serializeAttempt(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel attempt" },
      { status: 400 }
    );
  }
}
