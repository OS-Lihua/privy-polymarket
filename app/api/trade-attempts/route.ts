import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  BLOCKING_ATTEMPT_STATUSES,
  NEG_RISK_ADAPTER_ADDRESS,
  getFeeConfig,
} from "@/lib/server/config";
import {
  requirePrivyAuth,
  verifyDepositWalletOwnership,
} from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { getUsdcAllowance, getUsdcBalance } from "@/lib/server/onchain";
import { serializeAttempt } from "@/lib/server/serialize";
import { getTraceId, logger, logError } from "@/lib/server/logger";

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);

  try {
    const auth = await requirePrivyAuth(request);
    const body = await request.json();
    const quote = body.quote;

    if (!quote || typeof quote !== "object") {
      throw new Error("quote is required");
    }

    if (new Date(String(quote.expiresAt)).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Quote has expired" }, { status: 400 });
    }

    const { eoaAddress, safeAddress } = await verifyDepositWalletOwnership({
      eoaAddress: String(quote.eoaAddress || ""),
      safeAddress: String(quote.safeAddress || ""),
    });

    logger.info({
      event: "api_attempt_create_requested",
      traceId,
      quoteId: quote.quoteId,
      privyUserId: auth.privyUserId,
      eoaAddress,
      safeAddress,
      tokenId: quote.tokenId,
    });

    const activeAttempt = await prisma.tradeAttempt.findFirst({
      where: {
        privyUserId: auth.privyUserId,
        safeAddress,
        status: { in: [...BLOCKING_ATTEMPT_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeAttempt) {
      logger.warn({
        event: "api_attempt_blocked_by_active_attempt",
        traceId,
        activeAttemptId: activeAttempt.id,
        activeAttemptStatus: activeAttempt.status,
        safeAddress,
      });
      return NextResponse.json(
        { error: "Active trade attempt already exists", attempt: serializeAttempt(activeAttempt) },
        { status: 409 }
      );
    }

    const feeConfig = getFeeConfig();
    const totalAmountUsdcMicros = BigInt(String(quote.totalAmountUsdcMicros));
    const safeBalance = await getUsdcBalance(safeAddress);

    if (safeBalance < totalAmountUsdcMicros) {
      logger.warn({
        event: "api_attempt_insufficient_balance",
        traceId,
        safeAddress,
        safeBalance: safeBalance.toString(),
        totalAmountUsdcMicros: totalAmountUsdcMicros.toString(),
      });
      return NextResponse.json(
        { error: "Trading wallet pUSD balance is below total payment" },
        { status: 400 }
      );
    }

    const orderAmountUsdcMicros = BigInt(String(quote.orderAmountUsdcMicros));
    const adapterAllowance = await getUsdcAllowance(
      safeAddress,
      NEG_RISK_ADAPTER_ADDRESS
    );

    if (adapterAllowance < orderAmountUsdcMicros) {
      logger.warn({
        event: "api_attempt_insufficient_allowance",
        traceId,
        safeAddress,
        spender: NEG_RISK_ADAPTER_ADDRESS,
        allowance: adapterAllowance.toString(),
        orderAmountUsdcMicros: orderAmountUsdcMicros.toString(),
      });
      return NextResponse.json(
        {
          error:
            "Trading wallet needs token approval for the Neg Risk Adapter. Reinitialize the trading session.",
        },
        { status: 400 }
      );
    }

    const attempt = await prisma.tradeAttempt.create({
      data: {
        privyUserId: auth.privyUserId,
        eoaAddress,
        safeAddress,
        marketId: nullableString(quote.marketId),
        tokenId: String(quote.tokenId),
        outcome: nullableString(quote.outcome),
        negRisk: Boolean(quote.negRisk),
        totalAmountUsdcMicros,
        feeRateBps: Number(quote.feeRateBps),
        feeAmountUsdcMicros: BigInt(String(quote.feeAmountUsdcMicros)),
        orderAmountUsdcMicros: BigInt(String(quote.orderAmountUsdcMicros)),
        slippageBps: Number(quote.slippageBps),
        bestAsk: new Prisma.Decimal(String(quote.bestAsk)),
        worstPrice: new Prisma.Decimal(String(quote.worstPrice)),
        tickSize: new Prisma.Decimal(String(quote.tickSize)),
        estimatedShares: new Prisma.Decimal(String(quote.estimatedShares)),
        status: "fee_pending",
        feeWallet: feeConfig.feeWallet,
        quoteSnapshotJson: quote,
      },
    });

    logger.info({
      event: "api_attempt_created",
      traceId,
      quoteId: quote.quoteId,
      attemptId: attempt.id,
      status: attempt.status,
      feeAmountUsdcMicros: attempt.feeAmountUsdcMicros.toString(),
      orderAmountUsdcMicros: attempt.orderAmountUsdcMicros.toString(),
    });

    return NextResponse.json({ attempt: serializeAttempt(attempt) });
  } catch (error) {
    logError(error, { event: "api_attempt_create_failed", traceId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create attempt" },
      { status: 400 }
    );
  }
}

function nullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}
