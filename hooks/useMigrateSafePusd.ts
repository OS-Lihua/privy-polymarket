import { useCallback, useState } from "react";
import type { RelayClient } from "@polymarket/builder-relayer-client";
import { encodeFunctionData, erc20Abi } from "viem";
import { PUSD_CONTRACT_ADDRESS } from "@/constants/tokens";

export type MigrateSafePusdParams = {
  depositWalletAddress: string;
  amount: bigint;
};

export default function useMigrateSafePusd() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const migrateSafePusd = useCallback(
    async (relayClient: RelayClient, params: MigrateSafePusdParams) => {
      if (params.amount <= 0n) {
        throw new Error("No pUSD to migrate");
      }

      setIsMigrating(true);
      setError(null);

      try {
        const response = await relayClient.execute(
          [
            {
              to: PUSD_CONTRACT_ADDRESS,
              value: "0",
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "transfer",
                args: [
                  params.depositWalletAddress as `0x${string}`,
                  params.amount,
                ],
              }),
            },
          ],
          `Migrate ${params.amount.toString()} pUSD to Deposit Wallet`
        );

        const result = await response.wait();
        const txHash =
          (result as any)?.transactionHash ||
          (result as any)?.hash ||
          (result as any)?.transactions?.[0]?.transactionHash ||
          (result as any)?.transactions?.[0]?.hash;

        if (!txHash) {
          throw new Error("Migration completed without a transaction hash");
        }

        return txHash as string;
      } catch (err) {
        const nextError =
          err instanceof Error ? err : new Error("Failed to migrate pUSD");
        setError(nextError);
        throw nextError;
      } finally {
        setIsMigrating(false);
      }
    },
    []
  );

  return {
    migrateSafePusd,
    isMigrating,
    error,
  };
}
