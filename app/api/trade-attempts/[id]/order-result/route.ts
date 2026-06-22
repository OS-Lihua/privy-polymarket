import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { serializeAttempt } from "@/lib/server/serialize";
import { classifyClientOrderResult } from "@/lib/server/trade-attempts";
import { getTraceId, logger, logError } from "@/lib/server/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(request.headers);

  try {
    const auth = await requirePrivyAuth(request);
    const { id } = await params;
    const body = await request.json();
    const attempt = await prisma.tradeAttempt.findUnique({ where: { id } });

    if (!attempt || attempt.privyUserId !== auth.privyUserId) {
      logger.warn({ event: "api_order_result_attempt_not_found", traceId, id });
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "fee_verified" && attempt.status !== "order_pending") {
      return NextResponse.json(
        { error: "Order result requires a verified fee" },
        { status: 400 }
      );
    }

    const classification = classifyClientOrderResult(body);
    logger.info({
      event: "api_order_result_received",
      traceId,
      attemptId: id,
      clientReportedStatus: body.status,
      previousStatus: attempt.status,
      classifiedStatus: classification.status,
      error: body.error,
      response: body.response,
    });

    const updated = await prisma.tradeAttempt.update({
      where: { id },
      data: {
        status: classification.status,
        polymarketOrderId: classification.polymarketOrderId,
        feeRetainedAt: classification.feeRetainedAt,
        errorMessage: classification.errorMessage,
        clientOrderResponseJson: body.response ?? undefined,
        clientOrderErrorJson: body.error ?? undefined,
        clientReportedStatus:
          typeof body.status === "string" ? body.status : undefined,
        clientReportedAt: new Date(),
      },
    });

    logger.info({
      event: "api_order_result_recorded",
      traceId,
      attemptId: id,
      status: updated.status,
      polymarketOrderId: updated.polymarketOrderId,
    });

    return NextResponse.json({ attempt: serializeAttempt(updated) });
  } catch (error) {
    logError(error, { event: "api_order_result_failed", traceId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record order result" },
      { status: 400 }
    );
  }
}
