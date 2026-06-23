import { NextRequest, NextResponse } from "next/server";
import { getFeeConfig } from "@/lib/server/config";
import { parseUsdcMicros, calculateFeeBreakdown } from "@/lib/server/fee-math";
import { createTradeQuote } from "@/lib/server/quote";
import {
	requirePrivyAuth,
	verifyDepositWalletOwnership,
} from "@/lib/server/auth";
import { getTraceId, logger, logError } from "@/lib/server/logger";

export async function POST(request: NextRequest) {
	const traceId = getTraceId(request.headers);

	try {
		const auth = await requirePrivyAuth(request);
		const body = await request.json();
		const tokenId = readString(body.tokenId, "tokenId");
		const { eoaAddress, depositWalletAddress } =
			await verifyDepositWalletOwnership({
				eoaAddress: readString(body.eoaAddress, "eoaAddress"),
				depositWalletAddress: readString(
					body.depositWalletAddress ?? body.safeAddress,
					"depositWalletAddress",
				),
			});

		const feeConfig = getFeeConfig();
		const totalAmountUsdcMicros = parseUsdcMicros(body.totalAmountUsdc);

		logger.info({
			event: "api_quote_requested",
			traceId,
			privyUserId: auth.privyUserId,
			eoaAddress,
			depositWalletAddress,
			tokenId,
			totalAmountUsdcMicros: totalAmountUsdcMicros.toString(),
		});

		if (totalAmountUsdcMicros < feeConfig.minTotalUsdcMicros) {
			return NextResponse.json(
				{ error: "Minimum total payment is $2.00" },
				{ status: 400 },
			);
		}

		const breakdown = calculateFeeBreakdown(
			totalAmountUsdcMicros,
			feeConfig.feeBps,
		);

		const quote = await createTradeQuote({
			tokenId,
			marketId: typeof body.marketId === "string" ? body.marketId : undefined,
			outcome: typeof body.outcome === "string" ? body.outcome : undefined,
			negRisk: Boolean(body.negRisk),
			feeRateBps: feeConfig.feeBps,
			...breakdown,
		});

		logger.info({
			event: "api_quote_created",
			traceId,
			quoteId: quote.quoteId,
			tokenId,
			bestAsk: quote.bestAsk,
			worstPrice: quote.worstPrice,
			tickSize: quote.tickSize,
			expiresAt: quote.expiresAt,
		});

		return NextResponse.json({
			...serializeQuote(quote),
			privyUserId: auth.privyUserId,
			eoaAddress,
			depositWalletAddress,
			feeWallet: feeConfig.feeWallet,
		});
	} catch (error) {
		logError(error, { event: "api_quote_failed", traceId });
		return NextResponse.json(
			{ error: "Failed to create quote", traceId },
			{ status: 400 },
		);
	}
}

function readString(value: unknown, name: string) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`${name} is required`);
	}
	return value.trim();
}

function serializeQuote(quote: Awaited<ReturnType<typeof createTradeQuote>>) {
	return {
		...quote,
		totalAmountUsdcMicros: quote.totalAmountUsdcMicros.toString(),
		feeAmountUsdcMicros: quote.feeAmountUsdcMicros.toString(),
		orderAmountUsdcMicros: quote.orderAmountUsdcMicros.toString(),
	};
}
