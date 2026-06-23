import {
  DepositWalletCall,
} from "@polymarket/builder-relayer-client";
import { encodeFunctionData, erc20Abi } from "viem";
import {
  COLLATERAL_ONRAMP_ADDRESS,
  USDC_E_CONTRACT_ADDRESS,
} from "@/constants/tokens";

export interface WrapParams {
  walletAddress: `0x${string}`;
  amount: bigint;
}

const collateralOnrampAbi = [
  {
    inputs: [
      { name: "collateral", type: "address" },
      { name: "receiver", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "wrap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const createWrapUsdcToPusdCalls = (
  params: WrapParams
): DepositWalletCall[] => {
  const { walletAddress, amount } = params;

  return [
    {
      target: USDC_E_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [COLLATERAL_ONRAMP_ADDRESS, amount],
      }),
      value: "0",
    },
    {
      target: COLLATERAL_ONRAMP_ADDRESS,
      data: encodeFunctionData({
        abi: collateralOnrampAbi,
        functionName: "wrap",
        args: [USDC_E_CONTRACT_ADDRESS, walletAddress, amount],
      }),
      value: "0",
    },
  ];
};
