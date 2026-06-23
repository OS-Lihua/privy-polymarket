import type { TradeAttempt } from "@prisma/client";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  formatEther,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import {
  getAutoRefundConfig,
  getFeeConfig,
  getPlatformFeePrivateKey,
  PUSD_ADDRESS,
} from "@/lib/server/config";
import { serverPolygonTransport } from "@/lib/server/polygonTransport";

type RefundSuccess = {
  ok: true;
  txHash: string;
  grossUsdcMicros: bigint;
  gasFeeUsdcMicros: bigint;
  netUsdcMicros: bigint;
  estimate: RefundGasEstimate;
};

type RefundReview = {
  ok: false;
  status: "refund_pending_review" | "refund_too_small_review";
  errorMessage: string;
  grossUsdcMicros: bigint;
  gasFeeUsdcMicros?: bigint;
  netUsdcMicros?: bigint;
  estimate?: RefundGasEstimate;
};

export type RefundResult = RefundSuccess | RefundReview;

type RefundGasEstimate = {
  gas: string;
  maxFeePerGas: string;
  gasCostWei: string;
  gasCostPol: string;
  polUsd: number;
  bufferBps: number;
  gasFeeUsdcMicros: string;
};

export async function executeAutomaticRefund(
  attempt: Pick<
    TradeAttempt,
    "id" | "feeAmountUsdcMicros" | "depositWalletAddress"
  >
): Promise<RefundResult> {
  const grossUsdcMicros = attempt.feeAmountUsdcMicros;

  try {
    const estimate = await estimateRefundGasFeeMicros({
      recipient: attempt.depositWalletAddress,
      amount: grossUsdcMicros,
    });
    const gasFeeUsdcMicros = BigInt(estimate.gasFeeUsdcMicros);
    const netUsdcMicros = grossUsdcMicros - gasFeeUsdcMicros;
    const config = getAutoRefundConfig();

    if (netUsdcMicros < config.minNetUsdcMicros) {
      return {
        ok: false,
        status: "refund_too_small_review",
        errorMessage: "Refund net amount is below AUTO_REFUND_MIN_NET_USDC_MICROS",
        grossUsdcMicros,
        gasFeeUsdcMicros,
        netUsdcMicros,
        estimate,
      };
    }

    const txHash = await sendPusdRefund({
      recipient: attempt.depositWalletAddress,
      amount: netUsdcMicros,
    });

    return {
      ok: true,
      txHash,
      grossUsdcMicros,
      gasFeeUsdcMicros,
      netUsdcMicros,
      estimate,
    };
  } catch (error) {
    return {
      ok: false,
      status: "refund_pending_review",
      errorMessage:
        error instanceof Error ? error.message : "Automatic refund failed",
      grossUsdcMicros,
    };
  }
}

async function estimateRefundGasFeeMicros(input: {
  recipient: string;
  amount: bigint;
}): Promise<RefundGasEstimate> {
  const account = privateKeyToAccount(getPlatformFeePrivateKey());
  const client = createPublicClient({
    chain: polygon,
    transport: serverPolygonTransport(),
  });
  const data = encodeTransfer(input.recipient, input.amount);
  const [gas, block, polUsd] = await Promise.all([
    client.estimateGas({
      account,
      to: PUSD_ADDRESS,
      data,
      value: 0n,
    }),
    client.getBlock(),
    fetchPolUsdPrice(),
  ]);
  const maxFeePerGas = block.baseFeePerGas
    ? (block.baseFeePerGas * 2n)
    : await client.getGasPrice();
  const gasCostWei = gas * maxFeePerGas;
  const config = getAutoRefundConfig();
  const gasCostUsdMicros = decimalToMicros(Number(formatEther(gasCostWei)) * polUsd);
  const gasFeeUsdcMicros =
    (gasCostUsdMicros * BigInt(10_000 + config.gasBufferBps)) / 10_000n;

  return {
    gas: gas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    gasCostWei: gasCostWei.toString(),
    gasCostPol: formatEther(gasCostWei),
    polUsd,
    bufferBps: config.gasBufferBps,
    gasFeeUsdcMicros: gasFeeUsdcMicros.toString(),
  };
}

async function sendPusdRefund(input: { recipient: string; amount: bigint }) {
  const account = privateKeyToAccount(getPlatformFeePrivateKey());
  const feeWallet = getFeeConfig().feeWallet;

  if (getAddress(account.address) !== feeWallet) {
    throw new Error("PLATFORM_FEE_PRIVATE_KEY does not match PLATFORM_FEE_WALLET");
  }

  const walletClient = createWalletClient({
    account,
    chain: polygon,
    transport: serverPolygonTransport(),
  });

  return walletClient.sendTransaction({
    to: PUSD_ADDRESS,
    data: encodeTransfer(input.recipient, input.amount),
    value: 0n,
  });
}

function encodeTransfer(recipient: string, amount: bigint) {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [getAddress(recipient), amount],
  });
}

async function fetchPolUsdPrice() {
  const url = getAutoRefundConfig().polUsdPriceUrl;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`POL/USD price request failed (${response.status})`);
  }

  const body = await response.json();
  const price = body?.["polygon-ecosystem-token"]?.usd;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new Error("POL/USD price response is invalid");
  }

  return price;
}

function decimalToMicros(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Invalid decimal amount");
  }

  return BigInt(Math.ceil(value * 1_000_000));
}
