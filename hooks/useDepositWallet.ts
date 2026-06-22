import { useCallback, useMemo } from "react";
import {
  RelayClient,
  RelayerTransactionState,
} from "@polymarket/builder-relayer-client";
import { useWallet } from "@/providers/WalletContext";

export default function useDepositWallet(relayClient: RelayClient | null) {
  const { eoaAddress, publicClient } = useWallet();

  const canDeriveDepositWallet = Boolean(eoaAddress && relayClient);

  const deriveDepositWalletAddress = useCallback(async () => {
    if (!relayClient) return undefined;
    return relayClient.deriveDepositWalletAddress();
  }, [relayClient]);

  const isDepositWalletDeployed = useCallback(
    async (walletAddress: string) => {
      try {
        const deployed = await (relayClient as any)?.getDeployed(
          walletAddress,
          "WALLET"
        );
        if (typeof deployed === "boolean") return deployed;
      } catch {
        // Fall back to RPC below.
      }

      const code = await publicClient?.getCode({
        address: walletAddress as `0x${string}`,
      });
      return !!code && code !== "0x";
    },
    [publicClient, relayClient]
  );

  const deployDepositWallet = useCallback(async (client = relayClient) => {
    if (!client) {
      throw new Error("Relay client is not initialized");
    }

    const response = await client.deployDepositWallet();
    const result = await client.pollUntilState(
      response.transactionID,
      [
        RelayerTransactionState.STATE_MINED,
        RelayerTransactionState.STATE_CONFIRMED,
      ],
      RelayerTransactionState.STATE_FAILED,
      100,
      3000
    );

    if (!result) {
      throw new Error("Deposit wallet deployment failed");
    }

    return client.deriveDepositWalletAddress();
  }, [relayClient]);

  return useMemo(
    () => ({
      canDeriveDepositWallet,
      deriveDepositWalletAddress,
      isDepositWalletDeployed,
      deployDepositWallet,
    }),
    [
      canDeriveDepositWallet,
      deriveDepositWalletAddress,
      isDepositWalletDeployed,
      deployDepositWallet,
    ]
  );
}
