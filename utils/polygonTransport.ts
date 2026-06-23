import { fallback, http } from "viem";
import {
	POLYGON_FALLBACK_RPC_URLS,
	POLYGON_RPC_URL,
} from "@/constants/polymarket";

export function polygonTransport() {
	const urls = uniqueRpcUrls([POLYGON_RPC_URL, ...POLYGON_FALLBACK_RPC_URLS]);

	return fallback(
		urls.map((url) =>
			http(url, {
				retryCount: 1,
				timeout: 8_000,
			}),
		),
		{
			retryCount: 1,
		},
	);
}

function uniqueRpcUrls(urls: readonly string[]) {
	return urls.filter((url, index) => url && urls.indexOf(url) === index);
}
