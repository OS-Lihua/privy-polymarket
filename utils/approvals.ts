import { createPublicClient, encodeFunctionData, erc20Abi } from "viem";
import type { DepositWalletCall } from "@polymarket/builder-relayer-client";
import { polygon } from "viem/chains";
import {
	PUSD_CONTRACT_ADDRESS,
	CTF_CONTRACT_ADDRESS,
	CTF_EXCHANGE_V2_ADDRESS,
	NEG_RISK_CTF_EXCHANGE_V2_ADDRESS,
	NEG_RISK_ADAPTER_ADDRESS,
} from "@/constants/tokens";
import { polygonTransport } from "@/utils/polygonTransport";

const MAX_UINT256 =
	"115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const APPROVAL_SCHEMA_VERSION = 2;

const erc1155Abi = [
	{
		inputs: [
			{ name: "operator", type: "address" },
			{ name: "approved", type: "bool" },
		],
		name: "setApprovalForAll",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ name: "account", type: "address" },
			{ name: "operator", type: "address" },
		],
		name: "isApprovedForAll",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

const publicClient = createPublicClient({
	chain: polygon,
	transport: polygonTransport(),
});

const PUSD_SPENDERS = [
	{ address: CTF_EXCHANGE_V2_ADDRESS, name: "CTF Exchange V2" },
	{
		address: NEG_RISK_CTF_EXCHANGE_V2_ADDRESS,
		name: "Neg Risk CTF Exchange V2",
	},
	{ address: NEG_RISK_ADAPTER_ADDRESS, name: "Neg Risk Adapter" },
] as const;

const OUTCOME_TOKEN_SPENDERS = [
	{ address: CTF_EXCHANGE_V2_ADDRESS, name: "CTF Exchange V2" },
	{ address: NEG_RISK_CTF_EXCHANGE_V2_ADDRESS, name: "Neg Risk Exchange V2" },
	{ address: NEG_RISK_ADAPTER_ADDRESS, name: "Neg Risk Adapter" },
] as const;

const checkPusdApprovalForSpender = async (
	depositWalletAddress: string,
	spender: string,
): Promise<boolean> => {
	try {
		const allowance = await publicClient.readContract({
			address: PUSD_CONTRACT_ADDRESS as `0x${string}`,
			abi: erc20Abi,
			functionName: "allowance",
			args: [depositWalletAddress as `0x${string}`, spender as `0x${string}`],
		});

		const threshold = BigInt("1000000000000");
		return allowance >= threshold;
	} catch {
		return false;
	}
};

const checkERC1155ApprovalForSpender = async (
	depositWalletAddress: string,
	spender: string,
): Promise<boolean> => {
	try {
		const isApproved = await publicClient.readContract({
			address: CTF_CONTRACT_ADDRESS as `0x${string}`,
			abi: erc1155Abi,
			functionName: "isApprovedForAll",
			args: [depositWalletAddress as `0x${string}`, spender as `0x${string}`],
		});

		return isApproved;
	} catch {
		return false;
	}
};

export const checkAllApprovals = async (
	depositWalletAddress: string,
): Promise<{
	allApproved: boolean;
	usdcApprovals: Record<string, boolean>;
	outcomeTokenApprovals: Record<string, boolean>;
}> => {
	const usdcApprovals: Record<string, boolean> = {};
	const outcomeTokenApprovals: Record<string, boolean> = {};

	await Promise.all(
		PUSD_SPENDERS.map(async ({ address, name }) => {
			usdcApprovals[name] = await checkPusdApprovalForSpender(
				depositWalletAddress,
				address,
			);
		}),
	);

	await Promise.all(
		OUTCOME_TOKEN_SPENDERS.map(async ({ address, name }) => {
			outcomeTokenApprovals[name] = await checkERC1155ApprovalForSpender(
				depositWalletAddress,
				address,
			);
		}),
	);

	const allApproved =
		Object.values(usdcApprovals).every((approved) => approved) &&
		Object.values(outcomeTokenApprovals).every((approved) => approved);

	return {
		allApproved,
		usdcApprovals,
		outcomeTokenApprovals,
	};
};

export const createAllApprovalCalls = (): DepositWalletCall[] => {
	const calls: DepositWalletCall[] = [];

	for (const { address } of PUSD_SPENDERS) {
		calls.push({
			target: PUSD_CONTRACT_ADDRESS,
			data: encodeFunctionData({
				abi: erc20Abi,
				functionName: "approve",
				args: [address as `0x${string}`, BigInt(MAX_UINT256)],
			}),
			value: "0",
		});
	}

	for (const { address } of OUTCOME_TOKEN_SPENDERS) {
		calls.push({
			target: CTF_CONTRACT_ADDRESS,
			data: encodeFunctionData({
				abi: erc1155Abi,
				functionName: "setApprovalForAll",
				args: [address as `0x${string}`, true],
			}),
			value: "0",
		});
	}

	return calls;
};
