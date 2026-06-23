import { useState, useCallback } from "react";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { createUsdcTransferCall, TransferParams } from "@/utils/transfer";

export default function useUsdcTransfer() {
	const [isTransferring, setIsTransferring] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const transferUsdc = useCallback(
		async (
			relayClient: RelayClient,
			params: TransferParams,
		): Promise<string> => {
			setIsTransferring(true);
			setError(null);

			try {
				if (!params.walletAddress) {
					throw new Error("Deposit wallet is not ready");
				}

				const response = await relayClient.executeDepositWalletBatch(
					[createUsdcTransferCall(params)],
					params.walletAddress,
					createDeadline(),
				);

				const result = await response.wait();
				const txHash =
					(result as any)?.transactionHash ||
					(result as any)?.hash ||
					(result as any)?.transactions?.[0]?.transactionHash ||
					(result as any)?.transactions?.[0]?.hash;

				if (!txHash) {
					throw new Error("Transfer completed without a transaction hash");
				}

				return txHash;
			} catch (err) {
				const error =
					err instanceof Error ? err : new Error("Failed to transfer pUSD");
				setError(error);
				throw error;
			} finally {
				setIsTransferring(false);
			}
		},
		[],
	);

	return {
		isTransferring,
		error,
		transferUsdc,
	};
}

function createDeadline() {
	return Math.floor(Date.now() / 1000 + 10 * 60).toString();
}
