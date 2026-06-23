import { useQuery } from "@tanstack/react-query";

export type BridgeToken = {
	name?: string;
	symbol?: string;
	address?: string;
	decimals?: number;
};

export type BridgeSupportedAsset = {
	chainId?: string;
	chainName?: string;
	token?: BridgeToken;
	minCheckoutUsd?: number;
};

export type BridgeDepositAddresses = {
	evm?: string;
	svm?: string;
	btc?: string;
	tvm?: string;
	tron?: string;
};

type BridgeDepositResponse = {
	address?: BridgeDepositAddresses;
	note?: string;
};

export function useBridgeSupportedAssets() {
	return useQuery({
		queryKey: ["bridge-supported-assets"],
		queryFn: async (): Promise<BridgeSupportedAsset[]> => {
			const response = await fetch("/api/polymarket/bridge/supported-assets");
			if (!response.ok) {
				throw new Error("Failed to load supported bridge assets");
			}

			const data = await response.json();
			return Array.isArray(data.supportedAssets) ? data.supportedAssets : [];
		},
		staleTime: 5 * 60 * 1000,
	});
}

export function useBridgeDepositAddresses(depositWalletAddress?: string) {
	return useQuery({
		queryKey: ["bridge-deposit-addresses", depositWalletAddress],
		queryFn: async (): Promise<BridgeDepositResponse> => {
			const response = await fetch("/api/polymarket/bridge/deposit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ address: depositWalletAddress }),
			});

			if (!response.ok) {
				throw new Error("Failed to create bridge deposit address");
			}

			return response.json();
		},
		enabled: !!depositWalletAddress,
		staleTime: 30 * 60 * 1000,
	});
}

export function getBridgeAddressType(chainName?: string) {
	const normalized = String(chainName || "").toLowerCase();
	if (normalized.includes("solana")) return "svm";
	if (normalized.includes("bitcoin")) return "btc";
	if (normalized.includes("tron")) return "tron";
	return "evm";
}
