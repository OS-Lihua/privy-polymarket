import { NextRequest, NextResponse } from "next/server";
import { POLYMARKET_DATA_API_URL } from "@/constants/api";
import { logError } from "@/lib/server/logger";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const user = searchParams.get("user");

	if (!user) {
		return NextResponse.json(
			{ error: "User address is required" },
			{ status: 400 },
		);
	}

	try {
		const params = new URLSearchParams({
			user,
			sizeThreshold: "0.01",
			limit: "500",
		});

		const response = await fetch(
			`${POLYMARKET_DATA_API_URL}/positions?${params}`,
			{
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
			},
		);

		if (!response.ok) {
			throw new Error(`Polymarket API error: ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
			},
		});
	} catch (error) {
		logError(error, { event: "api_positions_failed" });
		return NextResponse.json(
			{ error: "Failed to fetch positions" },
			{ status: 500 },
		);
	}
}
