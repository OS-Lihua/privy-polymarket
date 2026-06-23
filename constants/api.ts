// Polymarket API URLs
export const RELAYER_URL = "https://relayer-v2.polymarket.com/";
export const CLOB_API_URL = "https://clob.polymarket.com";
export const GEOBLOCK_API_URL = "https://polymarket.com/api/geoblock";
export const GAMMA_API_URL = "https://gamma-api.polymarket.com";
export const POLYMARKET_PROFILE_URL = (address: string) =>
  `https://polymarket.com/${address}`;

// RPC
export const POLYGON_RPC_URL =
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL || "https://polygon-rpc.com";
export const POLYGON_FALLBACK_RPC_URLS = [
  "https://polygon-rpc.com",
  "https://rpc.ankr.com/polygon",
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon.drpc.org",
] as const;

// Remote signing endpoint
export const REMOTE_SIGNING_URL = () =>
  typeof window !== "undefined"
    ? `${window.location.origin}/api/polymarket/sign`
    : "/api/polymarket/sign";
