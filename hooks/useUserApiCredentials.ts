import { useCallback } from "react";
import { Chain, ClobClient } from "@polymarket/clob-client-v2";
import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@/providers/WalletContext";
import { CLOB_API_URL } from "@/constants/polymarket";

export interface UserApiCredentials {
  key: string;
  secret: string;
  passphrase: string;
}

type ApiKeyResponse = Partial<UserApiCredentials> & {
  error?: unknown;
};

const hasCredentials = (
  credentials: ApiKeyResponse | null | undefined
): credentials is UserApiCredentials => {
  return Boolean(
    credentials?.key && credentials.secret && credentials.passphrase
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
        console.log("Creating or deriving User API Credentials...");
        const credentials =
          (await tempClient.createOrDeriveApiKey()) as ApiKeyResponse;
        if (hasCredentials(credentials)) {
          console.log("Successfully prepared User API Credentials");
          return credentials;
        }

        throw new Error(
          String(credentials.error || "Failed to get API credentials")
        );
      } catch (err) {
        console.error("Failed to get credentials:", err);
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
          String(builderCreds.error || "Failed to create builder credentials")
        );
      }

      const token = await getAccessToken();
      if (!token) throw new Error("Missing Privy access token");

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
            : "Failed to save builder credentials"
        );
      }

      return builderCreds;
    },
    [eoaAddress, getAccessToken, walletClient]
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
          : "Failed to check builder credentials"
      );
    }

    return Boolean(body.configured);
  }, [getAccessToken]);

  return {
    createOrDeriveUserApiCredentials,
    createAndStoreBuilderCredentials,
    hasStoredBuilderCredentials,
  };
}
