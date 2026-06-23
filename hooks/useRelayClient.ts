import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@/providers/WalletContext";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import {
	RelayClient,
	type RelayClient as RelayClientInstance,
} from "@polymarket/builder-relayer-client";

import {
	RELAYER_URL,
	POLYGON_CHAIN_ID,
	REMOTE_SIGNING_URL,
} from "@/constants/polymarket";
import type { Chain } from "viem";
import { polygonChainWithRpc } from "@/utils/polygonChain";

type RelayClientConstructor = new (
	relayerUrl: string,
	chainId: number,
	signer: NonNullable<ReturnType<typeof useWallet>["ethersSigner"]>,
	builderConfig: BuilderConfig,
	relayTxType?: undefined,
	options?: { chain: Chain },
) => RelayClientInstance;

// This hook is responsible for creating and managing the relay client instance
// The user's signer and builder config are used to initialize the relay client

export default function useRelayClient() {
	const [relayClient, setRelayClient] = useState<RelayClient | null>(null);
	const { eoaAddress, ethersSigner } = useWallet();
	const { getAccessToken } = usePrivy();

	// This function initializes the relay client with
	// the user's signer and builder config
	const initializeRelayClient = useCallback(async () => {
		if (!eoaAddress || !ethersSigner) {
			throw new Error("Wallet not connected");
		}

		const token = await getAccessToken();
		if (!token) throw new Error("Missing Privy access token");

		// The Builder's credentials are obtained from 'polymarket.com/settings?tab=builder'
		// A remote signing server allows the builder credentials to be kept secure while signing requests

		const builderConfig = new BuilderConfig({
			remoteBuilderConfig: {
				url: REMOTE_SIGNING_URL(),
				token,
			},
		});

		// The relayClient instance is used for deploying the Safe,
		// setting token approvals, and executing CTF operations such
		// as splitting, merging, and redeeming positions.

		// builder-relayer-client still depends on builder-signing-sdk 0.0.x while
		// clob-client 5.x uses 1.x. The runtime shape is compatible, but their
		// private TS fields make the constructor types nominally incompatible.
		const CompatibleRelayClient =
			RelayClient as unknown as RelayClientConstructor;

		const client = new CompatibleRelayClient(
			RELAYER_URL,
			POLYGON_CHAIN_ID,
			ethersSigner,
			builderConfig,
			undefined,
			{ chain: polygonChainWithRpc() },
		);

		setRelayClient(client);
		return client;
	}, [eoaAddress, ethersSigner, getAccessToken]);

	// This function clears the relay client and resets the state
	const clearRelayClient = useCallback(() => {
		setRelayClient(null);
	}, []);

	return {
		relayClient,
		initializeRelayClient,
		clearRelayClient,
	};
}
