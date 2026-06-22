import { useCallback } from "react";
import { Chain, ClobClient } from "@polymarket/clob-client-v2";
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
        // Create first. Calling derive for a wallet without an existing nonce=0
        // key returns a noisy 400 from the SDK before we can fall back.
        console.log("Creating new User API Credentials...");
        const newCreds = (await tempClient.createApiKey()) as ApiKeyResponse;
        if (hasCredentials(newCreds)) {
          console.log("Successfully created new User API Credentials");
          return newCreds;
        }

        console.log("Deriving existing User API Credentials...");
        const derivedCreds =
          (await tempClient.deriveApiKey()) as ApiKeyResponse;
        if (hasCredentials(derivedCreds)) {
          console.log("Successfully derived existing User API Credentials");
          return derivedCreds;
        }

        throw new Error(
          String(newCreds.error || derivedCreds.error || "Failed to get API credentials")
        );
      } catch (err) {
        console.error("Failed to get credentials:", err);
        throw err;
      }
    }, [eoaAddress, walletClient]);

  return { createOrDeriveUserApiCredentials };
}
