import type { DepositWalletCall } from "@polymarket/builder-relayer-client";
import { encodeFunctionData, erc20Abi } from "viem";
import { PUSD_CONTRACT_ADDRESS } from "@/constants/tokens";

export interface TransferParams {
  recipient: `0x${string}`;
  amount: bigint;
  walletAddress: string;
}

export const createUsdcTransferCall = (
  params: TransferParams
): DepositWalletCall => {
  const { recipient, amount } = params;

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, amount],
  });

  return {
    target: PUSD_CONTRACT_ADDRESS,
    data,
    value: "0",
  };
};
