import { Decimal } from "@prisma/client/runtime/library";
import { CLOB_API_URL, QUOTE_TTL_MS, SLIPPAGE_BPS } from "@/lib/server/config";
import { usdcMicrosToDecimalString } from "@/lib/server/fee-math";

export type QuoteInput = {
	tokenId: string;
	totalAmountUsdcMicros: bigint;
	feeRateBps: number;
	feeAmountUsdcMicros: bigint;
	orderAmountUsdcMicros: bigint;
	marketId?: string;
	outcome?: string;
	negRisk?: boolean;
};

export type TradeQuote = QuoteInput & {
	quoteId: string;
	bestAsk: string;
	tickSize: string;
	negRisk: boolean;
	worstPrice: string;
	estimatedShares: string;
	slippageBps: number;
	expiresAt: string;
};

type BookSummary = {
	bestAsk: string;
	tickSize: string;
	negRisk?: boolean;
};

export async function createTradeQuote(input: QuoteInput): Promise<TradeQuote> {
	const book = await fetchBookSummary(input.tokenId);
	const worstPrice = roundUpToTick(
		multiplyPrice(book.bestAsk, 10_000 + SLIPPAGE_BPS),
		book.tickSize,
	);
	const estimatedShares = divideDecimalStrings(
		usdcMicrosToDecimalString(input.orderAmountUsdcMicros),
		book.bestAsk,
	);

	return {
		...input,
		quoteId: crypto.randomUUID(),
		bestAsk: book.bestAsk,
		tickSize: book.tickSize,
		negRisk: input.negRisk ?? Boolean(book.negRisk),
		worstPrice,
		estimatedShares,
		slippageBps: SLIPPAGE_BPS,
		expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
	};
}

async function fetchBookSummary(tokenId: string): Promise<BookSummary> {
	const [priceResponse, bookResponse] = await Promise.all([
		fetch(`${CLOB_API_URL}/price?token_id=${tokenId}&side=BUY`, {
			cache: "no-store",
		}),
		fetch(`${CLOB_API_URL}/book?token_id=${tokenId}`, {
			cache: "no-store",
		}),
	]);

	if (!priceResponse.ok) {
		throw new Error(`Failed to fetch best ask: ${priceResponse.status}`);
	}

	if (!bookResponse.ok) {
		throw new Error(`Failed to fetch order book: ${bookResponse.status}`);
	}

	const priceJson = await priceResponse.json();
	const bookJson = await bookResponse.json();
	const bestAsk = String(priceJson.price || "");
	const tickSize = String(
		bookJson.tick_size || bookJson.minimum_tick_size || "0.01",
	);

	if (!isFinitePositiveDecimal(bestAsk)) {
		throw new Error("Polymarket returned an invalid best ask");
	}

	if (!isFinitePositiveDecimal(tickSize)) {
		throw new Error("Polymarket returned an invalid tick size");
	}

	return {
		bestAsk,
		tickSize,
		negRisk: Boolean(bookJson.neg_risk),
	};
}

function isFinitePositiveDecimal(value: string) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 && parsed < 2;
}

function multiplyPrice(price: string, bpsMultiplier: number) {
	return new Decimal(price).mul(bpsMultiplier).div(10_000).toString();
}

function roundUpToTick(price: string, tickSize: string) {
	const priceDecimal = new Decimal(price);
	const tickDecimal = new Decimal(tickSize);
	const ticks = priceDecimal.div(tickDecimal).ceil();
	const rounded = Decimal.min(ticks.mul(tickDecimal), new Decimal(1));
	return rounded.toFixed(decimalPlaces(tickSize));
}

function divideDecimalStrings(numerator: string, denominator: string) {
	return new Decimal(numerator).div(denominator).toFixed(6);
}

function decimalPlaces(value: string) {
	return value.includes(".") ? value.split(".")[1].length : 0;
}
