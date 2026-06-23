// Re-export API URLs from centralized location
export {
  RELAYER_URL,
  CLOB_API_URL,
  GEOBLOCK_API_URL,
  GAMMA_API_URL,
  POLYMARKET_DATA_API_URL,
  POLYMARKET_WEB_URL,
  POLYMARKET_PROFILE_URL,
  POLYGON_RPC_URL,
  POLYGON_FALLBACK_RPC_URLS,
  REMOTE_SIGNING_URL,
} from "./api";

// Chain configuration
export const POLYGON_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_POLYGON_CHAIN_ID || "137",
);

// Session storage
export const SESSION_STORAGE_KEY = "polymarket_trading_session";
