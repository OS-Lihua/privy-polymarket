import { useCallback } from "react";
import { Chain, ClobClient } from "@polymarket/clob-client-v2";
import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@/providers/WalletContext";
import { CLOB_API_URL } from "@/constants/polymarket";
import { logger, serializeError } from "@/lib/logger";

export interface UserApiCredentials {
	key: string;
	secret: string;
	passphrase: string;
}

type ApiKeyResponse = Partial<UserApiCredentials> & {
	error?: unknown;
};

const hasCredentials = (
	credentials: ApiKeyResponse | null | undefined,
): credentials is UserApiCredentials => {
	return Boolean(
		credentials?.key && credentials.secret && credentials.passphrase,
	);
};

// This hook's sole purpose is to derive or create
// the User API Credentials with a temporary ClobClient

export default function useUserApiCredentials() {
	const { eoaAddress, walletClient } = useWallet();
	const { getAccessToken } = usePrivy();

	// Creates temporary clobClient with ethers signer
	const createOrDeriveUserApiCredentials =
		useCallback(async (): Promise<UserApiCredentials> => {
			if (!eoaAddress || !walletClient) throw new Error("Wallet not connected");

			const tempClient = new ClobClient({
				host: CLOB_API_URL,
				chain: Chain.POLYGON,
				signer: walletClient,
			});

			try {
				logger.info({
					event: "user_api_credentials_create_or_derive_started",
				});
				const credentials =
					(await tempClient.createOrDeriveApiKey()) as ApiKeyResponse;
				if (hasCredentials(credentials)) {
					logger.info({
						event: "user_api_credentials_create_or_derive_succeeded",
					});
					return credentials;
				}

				throw new Error(
					String(credentials.error || "Failed to get API credentials"),
				);
			} catch (err) {
				logger.error({
					event: "user_api_credentials_create_or_derive_failed",
					error: serializeError(err),
				});
				throw err;
			}
		}, [eoaAddress, walletClient]);

	const createAndStoreBuilderCredentials = useCallback(
		async (apiCredentials: UserApiCredentials) => {
			if (!eoaAddress || !walletClient) throw new Error("Wallet not connected");

			const client = new ClobClient({
				host: CLOB_API_URL,
				chain: Chain.POLYGON,
				signer: walletClient,
				creds: apiCredentials,
			});
			const builderCreds =
				(await client.createBuilderApiKey()) as ApiKeyResponse;

			if (!hasCredentials(builderCreds)) {
				throw new Error(
					String(builderCreds.error || "Failed to create builder credentials"),
				);
			}

			const token = await getAccessToken();
			if (!token) throw new Error("Missing Privy access token");

			logger.info({ event: "builder_credentials_store_started" });

			const response = await fetch("/api/polymarket/builder-credentials", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					eoaAddress,
					builderCreds,
				}),
			});

			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(
					typeof body.error === "string"
						? body.error
						: "Failed to save builder credentials",
				);
			}

			logger.info({ event: "builder_credentials_store_succeeded" });
			return builderCreds;
		},
		[eoaAddress, getAccessToken, walletClient],
	);

	const hasStoredBuilderCredentials = useCallback(async () => {
		const token = await getAccessToken();
		if (!token) throw new Error("Missing Privy access token");

		const response = await fetch("/api/polymarket/sign/status", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const body = await response.json().catch(() => ({}));

		if (!response.ok) {
			throw new Error(
				typeof body.error === "string"
					? body.error
					: "Failed to check builder credentials",
			);
		}

		const configured = Boolean(body.configured);
		logger.info({
			event: "builder_credentials_status_checked",
			configured,
		});
		return configured;
	}, [getAccessToken]);

	return {
		createOrDeriveUserApiCredentials,
		createAndStoreBuilderCredentials,
		hasStoredBuilderCredentials,
	};
}
