import { useCallback } from "react";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { checkAllApprovals, createAllApprovalCalls } from "@/utils/approvals";

// Uses relayClient to set all required token approvals for trading

export default function useTokenApprovals() {
  const checkAllTokenApprovals = useCallback(async (depositWalletAddress: string) => {
    try {
      return await checkAllApprovals(depositWalletAddress);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to check approvals");
      throw error;
    }
  }, []);

  const setAllTokenApprovals = useCallback(
    async (
      relayClient: RelayClient,
      depositWalletAddress: string
    ): Promise<boolean> => {
      try {
        const response = await relayClient.executeDepositWalletBatch(
          createAllApprovalCalls(),
          depositWalletAddress,
          createDeadline()
        );
        await response.wait();
        return true;
      } catch (err) {
        console.error("Failed to set all token approvals:", err);
        return false;
      }
    },
    []
  );

  return {
    checkAllTokenApprovals,
    setAllTokenApprovals,
  };
}

function createDeadline() {
  return Math.floor(Date.now() / 1000 + 10 * 60).toString();
}
