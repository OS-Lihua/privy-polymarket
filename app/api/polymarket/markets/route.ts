import { NextRequest, NextResponse } from "next/server";
import { CLOB_API_URL, GAMMA_API_URL } from "@/constants/api";
import { logger, logError } from "@/lib/server/logger";

const MIN_LIQUIDITY_USD = 1000;
const MIN_LIQUIDITY_NON_EVERGREEN_USD = 5000;

const EVERGREEN_TAG_IDS = [2, 21, 120, 596, 1401, 100265, 100639];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit") || "10";
  const tagId = searchParams.get("tag_id");

  try {
    const fetchLimit = parseInt(limit) * 5;

    let url = `${GAMMA_API_URL}/events?closed=false&order=volume24hr&ascending=false&limit=${fetchLimit}&offset=0`;

    if (tagId) {
      url += `&tag_id=${tagId}&related_tags=true`;
    }

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      logger.warn({ event: "api_markets_gamma_error", status: response.status });
      throw new Error(`Gamma API error: ${response.status}`);
    }

    const events = await response.json();

    if (!Array.isArray(events)) {
      logger.warn({ event: "api_markets_invalid_response" });
      return NextResponse.json(
        { error: "Invalid API response" },
        { status: 500 }
      );
    }

    const allMarkets: any[] = [];

    for (const event of events) {
      if (event.ended || event.closed || !event.active) continue;

      const markets = event.markets || [];

      for (const market of markets) {
        allMarkets.push({
          ...market,
          eventTitle: event.title,
          eventSlug: event.slug,
          eventId: event.id,
          eventIcon: event.image || event.icon,
          negRisk: event.negRisk || false,
        });
      }
    }

    const validMarkets = allMarkets.filter((market: any) => {
      if (market.acceptingOrders === false) return false;
      if (market.closed === true) return false;
      if (!market.clobTokenIds) return false;

      if (market.outcomePrices) {
        try {
          const prices = JSON.parse(market.outcomePrices);
          const hasTradeablePrice = prices.some((price: string) => {
            const priceNum = parseFloat(price);
            return priceNum >= 0.05 && priceNum <= 0.95;
          });
          if (!hasTradeablePrice) return false;
        } catch {
          return false;
        }
      }

      const marketTagIds =
        market.tags?.map((t: any) => parseInt(t.id)) || [];
      const hasEvergreenTag = EVERGREEN_TAG_IDS.some((id) =>
        marketTagIds.includes(id)
      );

      const liquidity = parseFloat(market.liquidity || "0");

      if (!hasEvergreenTag && liquidity < MIN_LIQUIDITY_NON_EVERGREEN_USD) {
        return false;
      }
      if (liquidity < MIN_LIQUIDITY_USD) return false;

      return true;
    });

    const sortedMarkets = validMarkets.sort((a: any, b: any) => {
      const aScore =
        parseFloat(a.liquidity || "0") +
        parseFloat(a.volume24hr || a.volume || "0");
      const bScore =
        parseFloat(b.liquidity || "0") +
        parseFloat(b.volume24hr || b.volume || "0");
      return bScore - aScore;
    });

    const limitedMarkets = sortedMarkets.slice(0, parseInt(limit));
    const pricedMarkets = await addBestAskPrices(limitedMarkets);

    return NextResponse.json(pricedMarkets);
  } catch (error) {
    logError(error, { event: "api_markets_failed" });
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}

async function addBestAskPrices(markets: any[]) {
  const priced = await Promise.all(
    markets.map(async (market) => {
      const tokenIds = parseJsonArray(market.clobTokenIds);
      const realtimePrices: Record<string, any> = {};

      await Promise.all(
        tokenIds.map(async (tokenId: string) => {
          try {
            const response = await fetch(
              `${CLOB_API_URL}/price?token_id=${tokenId}&side=BUY`,
              { cache: "no-store" }
            );

            if (!response.ok) return;

            const data = await response.json();
            const askPrice = Number(data.price);

            if (Number.isFinite(askPrice) && askPrice > 0 && askPrice < 1) {
              realtimePrices[tokenId] = {
                askPrice,
                bidPrice: askPrice,
                midPrice: askPrice,
                spread: 0,
              };
            }
          } catch {
            // Keep market visible; unpriced outcomes will be disabled client-side.
          }
        })
      );

      return {
        ...market,
        realtimePrices,
      };
    })
  );

  return priced.filter((market) => Object.keys(market.realtimePrices).length > 0);
}

function parseJsonArray(value: unknown) {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
