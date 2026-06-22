import {
  createPublicClient,
  decodeEventLog,
  erc20Abi,
  getAddress,
  http,
  type Hex,
} from "viem";
import { polygon } from "viem/chains";
import { getPolygonRpcUrl, PUSD_ADDRESS } from "@/lib/server/config";

export type TransferVerificationInput = {
  txHash: Hex;
  from: string;
  to: string;
  amount: bigint;
};

export async function getUsdcBalance(address: string) {
  const client = polygonClient();
  return client.readContract({
    address: PUSD_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [getAddress(address)],
  });
}

export async function getUsdcAllowance(owner: string, spender: string) {
  const client = polygonClient();
  return client.readContract({
    address: PUSD_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [getAddress(owner), getAddress(spender)],
  });
}

export async function verifyUsdcTransfer(input: TransferVerificationInput) {
  const client = polygonClient();
  const receipt = await client.getTransactionReceipt({ hash: input.txHash });

  if (receipt.status !== "success") {
    throw new Error("Fee transaction did not succeed");
  }

  const latestBlock = await client.getBlockNumber();
  const confirmations = latestBlock - receipt.blockNumber + 1n;
  if (confirmations < 1n) {
    throw new Error("Fee transaction has no confirmations");
  }

  const expectedFrom = getAddress(input.from);
  const expectedTo = getAddress(input.to);

  const matchingLog = receipt.logs.some((log) => {
    if (getAddress(log.address) !== PUSD_ADDRESS) return false;

    try {
      const event = decodeEventLog({
        abi: erc20Abi,
        data: log.data,
        topics: log.topics,
      });

      if (event.eventName !== "Transfer") return false;

      const args = event.args as {
        from: string;
        to: string;
        value: bigint;
      };

      return (
        getAddress(args.from) === expectedFrom &&
        getAddress(args.to) === expectedTo &&
        args.value === input.amount
      );
    } catch {
      return false;
    }
  });

  if (!matchingLog) {
    throw new Error("Expected pUSD Transfer log was not found");
  }

  return {
    blockNumber: receipt.blockNumber,
    confirmations,
  };
}

function polygonClient() {
  return createPublicClient({
    chain: polygon,
    transport: http(getPolygonRpcUrl()),
  });
}
