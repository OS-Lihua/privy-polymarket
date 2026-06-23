import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getAutoRefundConfig,
  getFeeConfig,
} from "@/lib/server/config";
import { requirePrivyAuth } from "@/lib/server/auth";
import {
  canCancelAttempt,
  requiresRefundOnCancel,
} from "@/lib/server/trade-attempts";
import { prisma } from "@/lib/server/prisma";
import { serializeAttempt } from "@/lib/server/serialize";
import { verifyUsdcTransfer } from "@/lib/server/onchain";
import { executeAutomaticRefund } from "@/lib/server/refunds";
import { getTraceId, logger, logError } from "@/lib/server/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(request.headers);

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

    if (!requiresRefundOnCancel(attempt)) {
      const updated = await prisma.tradeAttempt.update({
        where: { id },
        data: { status: "cancelled" },
      });
      logger.info({
        event: "api_attempt_cancelled",
        traceId,
        attemptId: id,
        status: updated.status,
      });

      return NextResponse.json({ attempt: serializeAttempt(updated) });
    }

    if (attempt.refundTxHash) {
      return NextResponse.json(
        { error: "Attempt already has a refund transaction" },
        { status: 400 }
      );
    }

    if (attempt.status === "fee_submitted") {
      const feeReceived = await verifySubmittedFee(attempt);
      if (!feeReceived) {
        const updated = await prisma.tradeAttempt.update({
          where: { id },
          data: {
            status: "cancelled",
            errorMessage: "Cancelled before fee transaction was verified",
          },
        });
        logger.info({
          event: "api_attempt_cancelled_before_fee_verified",
          traceId,
          attemptId: id,
          status: updated.status,
        });
        return NextResponse.json({ attempt: serializeAttempt(updated) });
      }
    }

    const autoRefundConfig = getAutoRefundConfig();
    if (!autoRefundConfig.enabled) {
      const updated = await prisma.tradeAttempt.update({
        where: { id },
        data: {
          status: "refund_pending_review",
          refundGrossUsdcMicros: attempt.feeAmountUsdcMicros,
          refundNetUsdcMicros: attempt.feeAmountUsdcMicros,
          refundErrorMessage: "Automatic refunds are disabled",
        },
      });
      logger.warn({
        event: "api_attempt_refund_review_required",
        traceId,
        attemptId: id,
        reason: "auto_refund_disabled",
      });
      return NextResponse.json({ attempt: serializeAttempt(updated) });
    }

    if (!(await canAutoRefundUser(auth.privyUserId))) {
      const updated = await prisma.tradeAttempt.update({
        where: { id },
        data: {
          status: "refund_pending_review",
          refundGrossUsdcMicros: attempt.feeAmountUsdcMicros,
          refundNetUsdcMicros: attempt.feeAmountUsdcMicros,
          refundErrorMessage: "Automatic refund rate limit exceeded",
        },
      });
      logger.warn({
        event: "api_attempt_refund_review_required",
        traceId,
        attemptId: id,
        reason: "auto_refund_rate_limited",
      });
      return NextResponse.json({ attempt: serializeAttempt(updated) });
    }

    const refund = await executeAutomaticRefund(attempt);
    const updated = await prisma.tradeAttempt.update({
      where: { id },
      data: refund.ok
        ? {
            status: "refund_paid",
            refundTxHash: refund.txHash,
            refundedAt: new Date(),
            refundGrossUsdcMicros: refund.grossUsdcMicros,
            refundGasFeeUsdcMicros: refund.gasFeeUsdcMicros,
            refundNetUsdcMicros: refund.netUsdcMicros,
            refundGasEstimateJson:
              refund.estimate as unknown as Prisma.InputJsonValue,
            refundErrorMessage: null,
          }
        : {
            status: refund.status,
            refundGrossUsdcMicros: refund.grossUsdcMicros,
            refundGasFeeUsdcMicros: refund.gasFeeUsdcMicros,
            refundNetUsdcMicros: refund.netUsdcMicros,
            refundGasEstimateJson: refund.estimate
              ? (refund.estimate as unknown as Prisma.InputJsonValue)
              : undefined,
            refundErrorMessage: refund.errorMessage,
          },
    });
    logger[refund.ok ? "info" : "warn"]({
      event: refund.ok ? "api_attempt_refund_paid" : "api_attempt_refund_review_required",
      traceId,
      attemptId: id,
      status: updated.status,
      refundTxHash: updated.refundTxHash,
      refundErrorMessage: updated.refundErrorMessage,
    });

    return NextResponse.json({ attempt: serializeAttempt(updated) });
  } catch (error) {
    logError(error, { event: "api_attempt_cancel_failed", traceId });
    return NextResponse.json(
      { error: "Failed to cancel attempt", traceId },
      { status: 400 }
    );
  }
}

async function verifySubmittedFee(attempt: {
  feeTxHash: string | null;
  depositWalletAddress: string;
  feeWallet: string;
  feeAmountUsdcMicros: bigint;
}) {
  if (!attempt.feeTxHash) return false;

  try {
    await verifyUsdcTransfer({
      txHash: attempt.feeTxHash as `0x${string}`,
      from: attempt.depositWalletAddress,
      to: attempt.feeWallet,
      amount: attempt.feeAmountUsdcMicros,
    });
    return true;
  } catch {
    return false;
  }
}

async function canAutoRefundUser(privyUserId: string) {
  const config = getAutoRefundConfig();
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const feeWallet = getFeeConfig().feeWallet;
  const count = await prisma.tradeAttempt.count({
    where: {
      privyUserId,
      feeWallet,
      status: "refund_paid",
      refundedAt: { gte: since },
    },
  });

  return count < config.maxPerUserPerHour;
}
