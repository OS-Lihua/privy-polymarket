import { fallback, http } from "viem";
import { POLYGON_FALLBACK_RPC_URLS } from "@/constants/polymarket";
import { getPolygonRpcUrl } from "@/lib/server/config";

export function serverPolygonTransport() {
  const urls = uniqueRpcUrls([
    getPolygonRpcUrl(),
    ...POLYGON_FALLBACK_RPC_URLS,
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
