import { NextResponse } from "next/server";
import { GEOBLOCK_API_URL } from "@/constants/api";
import { logger, logError } from "@/lib/server/logger";

export async function GET() {
  try {
    const response = await fetch(GEOBLOCK_API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "privy-polymarket-demo/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      logger.warn({
        event: "api_geoblock_upstream_error",
        status: response.status,
      });
      return NextResponse.json(
        { error: `Geoblock API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    logError(error, { event: "api_geoblock_failed" });
    return NextResponse.json(
      { error: "Failed to check geoblock" },
      { status: 502 }
    );
  }
}
