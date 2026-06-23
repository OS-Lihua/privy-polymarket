import { getAddress } from "viem";
import {
	CLOB_API_URL as DEFAULT_CLOB_API_URL,
	GAMMA_API_URL as DEFAULT_GAMMA_API_URL,
} from "@/constants/api";
import {
	NEG_RISK_ADAPTER_ADDRESS as DEFAULT_NEG_RISK_ADAPTER_ADDRESS,
	PUSD_CONTRACT_ADDRESS as DEFAULT_PUSD_ADDRESS,
	USDC_E_CONTRACT_ADDRESS as DEFAULT_USDC_E_ADDRESS,
} from "@/constants/tokens";

export const USDC_E_ADDRESS = getAddress(
	process.env.USDC_E_CONTRACT_ADDRESS ||
		process.env.NEXT_PUBLIC_USDC_E_CONTRACT_ADDRESS ||
		DEFAULT_USDC_E_ADDRESS,
);

export const PUSD_ADDRESS = getAddress(
	process.env.PUSD_CONTRACT_ADDRESS ||
		process.env.NEXT_PUBLIC_PUSD_CONTRACT_ADDRESS ||
		DEFAULT_PUSD_ADDRESS,
);

export const NEG_RISK_ADAPTER_ADDRESS = getAddress(
	process.env.NEG_RISK_ADAPTER_ADDRESS ||
		process.env.NEXT_PUBLIC_NEG_RISK_ADAPTER_ADDRESS ||
		DEFAULT_NEG_RISK_ADAPTER_ADDRESS,
);

export const CLOB_API_URL =
	process.env.CLOB_API_URL ||
	process.env.NEXT_PUBLIC_CLOB_API_URL ||
	DEFAULT_CLOB_API_URL;
export const GAMMA_API_URL =
	process.env.GAMMA_API_URL ||
	process.env.NEXT_PUBLIC_GAMMA_API_URL ||
	DEFAULT_GAMMA_API_URL;
export const POLYGON_CHAIN_ID = parseIntegerEnv(
	"POLYGON_CHAIN_ID",
	Number(process.env.NEXT_PUBLIC_POLYGON_CHAIN_ID || "137"),
);
export const SLIPPAGE_BPS = parseIntegerEnv("SLIPPAGE_BPS", 200);
export const QUOTE_TTL_MS = parseIntegerEnv("QUOTE_TTL_MS", 60_000);

export const TERMINAL_ATTEMPT_STATUSES = [
	"order_filled",
	"refund_paid",
	"cancelled",
	"failed",
] as const;

export const BLOCKING_ATTEMPT_STATUSES = [
	"created",
	"fee_pending",
	"fee_submitted",
	"fee_verified",
	"order_pending",
] as const;

export function getFeeConfig() {
	const feeWallet = process.env.PLATFORM_FEE_WALLET;

	if (!feeWallet) {
		throw new Error("PLATFORM_FEE_WALLET is not configured");
	}

	return {
		feeWallet: getAddress(feeWallet),
		feeBps: parseIntegerEnv("PLATFORM_FEE_BPS", 100),
		minTotalUsdcMicros: BigInt(
			parseIntegerEnv("MIN_TOTAL_USDC_MICROS", 2_000_000),
		),
	};
}

export function getPlatformFeePrivateKey() {
	const privateKey = process.env.PLATFORM_FEE_PRIVATE_KEY;
	if (!privateKey) {
		throw new Error("PLATFORM_FEE_PRIVATE_KEY is not configured");
	}

	return privateKey as `0x${string}`;
}

export function getAutoRefundConfig() {
	return {
		enabled: parseBooleanEnv("AUTO_REFUND_ENABLED", true),
		maxPerUserPerHour: parseIntegerEnv("AUTO_REFUND_MAX_PER_USER_PER_HOUR", 3),
		gasBufferBps: parseIntegerEnv("AUTO_REFUND_GAS_BUFFER_BPS", 2000),
		minNetUsdcMicros: BigInt(
			parseIntegerEnv("AUTO_REFUND_MIN_NET_USDC_MICROS", 100_000),
		),
		polUsdPriceUrl:
			process.env.POL_USD_PRICE_URL ||
			"https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token&vs_currencies=usd",
	};
}

export function getPolygonRpcUrl() {
	const rpcUrl =
		process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC_URL;

	if (!rpcUrl) {
		throw new Error("POLYGON_RPC_URL is not configured");
	}

	return rpcUrl;
}

function parseIntegerEnv(name: string, fallback: number) {
	const value = process.env[name];
	if (!value) return fallback;

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`${name} must be a non-negative integer`);
	}

	return parsed;
}

function parseBooleanEnv(name: string, fallback: boolean) {
	const value = process.env[name];
	if (!value) return fallback;

	return value === "true" || value === "1";
}
