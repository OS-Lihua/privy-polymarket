import { NextRequest, NextResponse } from "next/server";
import { isHex } from "viem";
import { requirePrivyAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { serializeAttempt } from "@/lib/server/serialize";
import { verifyUsdcTransfer } from "@/lib/server/onchain";
import { getTraceId, logger, logError } from "@/lib/server/logger";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const traceId = getTraceId(request.headers);

	try {
		const auth = await requirePrivyAuth(request);
		const { id } = await params;
		const body = await request.json();
		const feeTxHash = String(body.feeTxHash || "");

		if (!isHex(feeTxHash)) {
			logger.warn({ event: "api_fee_tx_invalid_hash", traceId, id, feeTxHash });
			return NextResponse.json({ error: "Invalid feeTxHash" }, { status: 400 });
		}

		const attempt = await prisma.tradeAttempt.findUnique({ where: { id } });
		if (!attempt || attempt.privyUserId !== auth.privyUserId) {
			logger.warn({ event: "api_fee_tx_attempt_not_found", traceId, id });
			return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
		}

		if (attempt.status !== "fee_pending" && attempt.status !== "created") {
			return NextResponse.json(
				{ error: "Fee transaction cannot be submitted for this attempt" },
				{ status: 400 },
			);
		}

		await prisma.tradeAttempt.update({
			where: { id },
			data: { status: "fee_submitted", feeTxHash },
		});

		logger.info({
			event: "api_fee_tx_submitted",
			traceId,
			attemptId: id,
			status: "fee_submitted",
			feeTxHash,
		});

		await verifyUsdcTransfer({
			txHash: feeTxHash,
			from: attempt.depositWalletAddress,
			to: attempt.feeWallet,
			amount: attempt.feeAmountUsdcMicros,
		});

		const updated = await prisma.tradeAttempt.update({
			where: { id },
			data: { status: "fee_verified", feeCollectedAt: new Date() },
		});

		logger.info({
			event: "api_fee_tx_verified",
			traceId,
			attemptId: id,
			status: updated.status,
			feeTxHash,
		});

		return NextResponse.json({ attempt: serializeAttempt(updated) });
	} catch (error) {
		logError(error, { event: "api_fee_tx_failed", traceId });
		return NextResponse.json(
			{ error: "Failed to verify fee transaction", traceId },
			{ status: 400 },
		);
	}
}
