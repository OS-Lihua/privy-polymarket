import { fallback, http } from "viem";
import { getPolygonRpcUrl } from "@/lib/server/config";

export function serverPolygonTransport() {
  const urls = uniqueRpcUrls([
    getPolygonRpcUrl(),
    ...getServerPolygonFallbackRpcUrls(),
  ]);

  return fallback(
    urls.map((url) =>
      http(url, {
        retryCount: 1,
        timeout: 8_000,
      })
    ),
    {
      retryCount: 1,
    }
  );
}

function uniqueRpcUrls(urls: readonly string[]) {
  return urls.filter((url, index) => url && urls.indexOf(url) === index);
}

function getServerPolygonFallbackRpcUrls() {
  return (
    process.env.POLYGON_FALLBACK_RPC_URLS ||
    process.env.NEXT_PUBLIC_POLYGON_FALLBACK_RPC_URLS ||
    "https://polygon-rpc.com,https://rpc.ankr.com/polygon,https://polygon-bor-rpc.publicnode.com,https://polygon.drpc.org"
  )
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}
