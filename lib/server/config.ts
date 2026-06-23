import { getAddress } from "viem";

export const USDC_E_ADDRESS = getAddress(
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
);

export const PUSD_ADDRESS = getAddress(
  "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB"
);

export const NEG_RISK_ADAPTER_ADDRESS = getAddress(
  "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296"
);

export const CLOB_API_URL = "https://clob.polymarket.com";
export const GAMMA_API_URL = "https://gamma-api.polymarket.com";
export const POLYGON_CHAIN_ID = 137;
export const SLIPPAGE_BPS = 200;
export const QUOTE_TTL_MS = 60_000;

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
      parseIntegerEnv("MIN_TOTAL_USDC_MICROS", 2_000_000)
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
      parseIntegerEnv("AUTO_REFUND_MIN_NET_USDC_MICROS", 100_000)
    ),
    polUsdPriceUrl:
      process.env.POL_USD_PRICE_URL ||
      "https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token&vs_currencies=usd",
  };
}

export function getPolygonRpcUrl() {
  const rpcUrl = process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC_URL;

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
