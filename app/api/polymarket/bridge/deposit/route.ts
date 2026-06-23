import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { POLYMARKET_BRIDGE_API_URL } from "@/constants/api";
import { logger, logError } from "@/lib/server/logger";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const address = String(body?.address || "");

		if (!isAddress(address)) {
			return NextResponse.json(
				{ error: "A valid Deposit Wallet address is required" },
				{ status: 400 },
			);
		}

		const response = await fetch(
			`${POLYMARKET_BRIDGE_API_URL.replace(/\/$/, "")}/deposit`,
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"User-Agent": "privy-polymarket-demo/1.0",
				},
				body: JSON.stringify({ address }),
				cache: "no-store",
			},
		);

		if (!response.ok) {
			logger.warn({
				event: "api_bridge_deposit_upstream_error",
				status: response.status,
			});
			return NextResponse.json(
				{ error: "Failed to create bridge deposit address" },
				{ status: 502 },
			);
		}

		const data = await response.json();
		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
			},
		});
	} catch (error) {
		logError(error, { event: "api_bridge_deposit_failed" });
		return NextResponse.json(
			{ error: "Failed to create bridge deposit address" },
			{ status: 502 },
		);
	}
}
