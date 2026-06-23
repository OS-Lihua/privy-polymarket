import { useCallback, useState } from "react";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { createWrapUsdcToPusdCalls, WrapParams } from "@/utils/wrap";

export default function useWrapUsdcToPusd() {
  const [isWrapping, setIsWrapping] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wrapUsdcToPusd = useCallback(
    async (relayClient: RelayClient, params: WrapParams): Promise<string> => {
      setIsWrapping(true);
      setError(null);

      try {
        const response = await relayClient.executeDepositWalletBatch(
          createWrapUsdcToPusdCalls(params),
          params.walletAddress,
          createDeadline()
        );

        const result = await response.wait();
        const txHash =
          (result as any)?.transactionHash ||
          (result as any)?.hash ||
          (result as any)?.transactions?.[0]?.transactionHash ||
          (result as any)?.transactions?.[0]?.hash;

        if (!txHash) {
          throw new Error("Wrap completed without a transaction hash");
        }

        return txHash;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to wrap USDC.e");
        setError(error);
        throw error;
      } finally {
        setIsWrapping(false);
      }
    },
    []
  );

  return {
    isWrapping,
    error,
    wrapUsdcToPusd,
  };
}

function createDeadline() {
  return Math.floor(Date.now() / 1000 + 10 * 60).toString();
}
