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

    if (!requiresRefundOnCancel(attempt)) {
      const updated = await prisma.tradeAttempt.update({
        where: { id },
        data: { status: "cancelled" },
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

    return NextResponse.json({ attempt: serializeAttempt(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel attempt" },
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
