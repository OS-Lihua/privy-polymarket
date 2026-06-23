import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/constants/api";
import { logger, logError } from "@/lib/server/logger";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const tokenId = searchParams.get("tokenId");

	if (!tokenId) {
		return NextResponse.json(
			{ error: "tokenId parameter is required" },
			{ status: 400 },
		);
	}

	try {
		const response = await fetch(
			`${GAMMA_API_URL}/markets?limit=100&offset=0&active=true&closed=false`,
			{
				headers: { "Content-Type": "application/json" },
				next: { revalidate: 300 },
			},
		);

		if (!response.ok) {
			logger.warn({
				event: "api_market_by_token_gamma_error",
				status: response.status,
			});
			throw new Error(`Gamma API error: ${response.status}`);
		}

		const markets = await response.json();

		if (!Array.isArray(markets)) {
			logger.warn({ event: "api_market_by_token_invalid_response" });
			return NextResponse.json(
				{ error: "Invalid API response" },
				{ status: 500 },
			);
		}

		const market = markets.find((m) => {
			if (!m.clobTokenIds) return false;
			try {
				const tokenIds = JSON.parse(m.clobTokenIds);
				return tokenIds.includes(tokenId);
			} catch {
				return false;
			}
		});

		if (!market) {
			return NextResponse.json({ error: "Market not found" }, { status: 404 });
		}

		return NextResponse.json(market);
	} catch (error) {
		logError(error, { event: "api_market_by_token_failed", tokenId });
		return NextResponse.json(
			{ error: "Failed to fetch market by token" },
			{ status: 500 },
		);
	}
}
