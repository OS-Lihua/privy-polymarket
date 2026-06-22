"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { TickSize } from "@polymarket/clob-client-v2";
import type { ClobClient } from "@polymarket/clob-client-v2";
import type { RelayClient } from "@polymarket/builder-relayer-client";
import Portal from "@/components/Portal";
import useClobOrder, { ClobOrderError } from "@/hooks/useClobOrder";
import useUsdcTransfer from "@/hooks/useUsdcTransfer";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import { cn } from "@/utils/classNames";
import { SUCCESS_STYLES } from "@/constants/ui";
import { useI18n } from "@/lib/i18n";
import { createTraceId, logger, serializeError } from "@/lib/logger";

type Quote = {
  quoteId: string;
  tokenId: string;
  outcome?: string;
  negRisk: boolean;
  tickSize: string;
  bestAsk: string;
  worstPrice: string;
  slippageBps: number;
  totalAmountUsdcMicros: string;
  feeRateBps: number;
  feeAmountUsdcMicros: string;
  orderAmountUsdcMicros: string;
  estimatedShares: string;
  expiresAt: string;
  eoaAddress: string;
  safeAddress: string;
  feeWallet: `0x${string}`;
};

type TradeAttempt = {
  id: string;
  status: string;
};

type OrderPlacementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  outcome: string;
  currentPrice: number;
  tokenId: string;
  negRisk?: boolean;
  clobClient: ClobClient | null;
};

export default function OrderPlacementModal({
  isOpen,
  onClose,
  marketTitle,
  outcome,
  currentPrice,
  tokenId,
  negRisk = false,
  clobClient,
}: OrderPlacementModalProps) {
  const [totalPayment, setTotalPayment] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [step, setStep] = useState<"quote" | "fee" | "order" | "done">("quote");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [traceId, setTraceId] = useState(() => createTraceId());
  const { t } = useI18n();

  const modalRef = useRef<HTMLDivElement>(null);
  const { getAccessToken } = usePrivy();
  const { eoaAddress } = useWallet();
  const { depositWalletAddress, relayClient } = useTrading();
  const { submitOrder, isSubmitting, error: orderError } = useClobOrder(
    clobClient,
    eoaAddress
  );
  const { transferUsdc, isTransferring, error: transferError } =
    useUsdcTransfer();

  useEffect(() => {
    if (isOpen) {
      setTotalPayment("");
      setQuote(null);
      setStep("quote");
      setLocalError(null);
      setTraceId(createTraceId());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && step === "quote") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, step]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPaymentNum = Number(totalPayment);
  const displayError =
    localError || orderError?.message || transferError?.message || null;

  const handleCreateQuote = async () => {
    if (!eoaAddress || !depositWalletAddress) {
      setLocalError("Trading wallet is not ready");
      return;
    }

    if (!Number.isFinite(totalPaymentNum) || totalPaymentNum < 2) {
      setLocalError("Minimum total payment is $2.00");
      return;
    }

    setIsCreatingQuote(true);
    setLocalError(null);

    try {
      logger.info({
        event: "trade_quote_requested",
        traceId,
        tokenId,
        outcome,
        negRisk,
        totalPayment,
        eoaAddress,
        safeAddress: depositWalletAddress,
      });
      const token = await readPrivyAccessToken(getAccessToken);
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-trace-id": traceId,
        },
        body: JSON.stringify({
          eoaAddress,
          safeAddress: depositWalletAddress,
          tokenId,
          outcome,
          negRisk,
          totalAmountUsdc: totalPayment,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Failed to create quote");
      }

      setQuote(body);
      logger.info({
        event: "trade_quote_received",
        traceId,
        quoteId: body.quoteId,
        tokenId: body.tokenId,
        bestAsk: body.bestAsk,
        worstPrice: body.worstPrice,
        orderAmountUsdcMicros: body.orderAmountUsdcMicros,
        feeAmountUsdcMicros: body.feeAmountUsdcMicros,
        expiresAt: body.expiresAt,
      });
    } catch (error) {
      logger.error({
        event: "trade_quote_failed",
        traceId,
        error: serializeError(error),
      });
      setLocalError(error instanceof Error ? error.message : "Failed to quote");
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const handleConfirm = async () => {
    if (!quote || !relayClient || !clobClient) {
      setLocalError("Trading clients are not ready");
      return;
    }

    let currentAttempt: TradeAttempt | null = null;

    try {
      setLocalError(null);
      logger.info({
        event: "trade_confirm_started",
        traceId,
        quoteId: quote.quoteId,
        tokenId: quote.tokenId,
        totalAmountUsdcMicros: quote.totalAmountUsdcMicros,
      });
      const token = await readPrivyAccessToken(getAccessToken);
      const attemptResponse = await fetch("/api/trade-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-trace-id": traceId,
        },
        body: JSON.stringify({ quote }),
      });
      const attemptBody = await attemptResponse.json();
      if (!attemptResponse.ok) {
        throw new Error(attemptBody.error || "Failed to create attempt");
      }

      const createdAttempt = attemptBody.attempt as TradeAttempt;
      currentAttempt = createdAttempt;
      logger.info({
        event: "trade_attempt_created",
        traceId,
        quoteId: quote.quoteId,
        attemptId: createdAttempt.id,
        status: createdAttempt.status,
      });
      setStep("fee");

      const feeTxHash = await payFee(relayClient, quote);
      logger.info({
        event: "trade_fee_transfer_submitted",
        traceId,
        quoteId: quote.quoteId,
        attemptId: createdAttempt.id,
        feeTxHash,
      });
      const feeResponse = await fetch(
        `/api/trade-attempts/${createdAttempt.id}/fee-tx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-trace-id": traceId,
          },
          body: JSON.stringify({ feeTxHash }),
        }
      );
      const feeBody = await feeResponse.json();
      if (!feeResponse.ok) {
        throw new Error(feeBody.error || "Failed to verify fee");
      }
      logger.info({
        event: "trade_fee_verified",
        traceId,
        quoteId: quote.quoteId,
        attemptId: createdAttempt.id,
        feeTxHash,
      });

      setStep("order");
      const orderResponse = await submitOrder({
        tokenId: quote.tokenId,
        side: "BUY",
        isMarketOrder: true,
        negRisk: quote.negRisk,
        tickSize: quote.tickSize as TickSize,
        amount: Number(formatMicros(quote.orderAmountUsdcMicros)),
        price: Number(quote.worstPrice),
        size: Number(quote.estimatedShares),
        traceId,
        attemptId: createdAttempt.id,
      });

      await fetch(`/api/trade-attempts/${createdAttempt.id}/order-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-trace-id": traceId,
        },
        body: JSON.stringify({
          status: "success",
          response: orderResponse,
        }),
      });

      setStep("done");
      setTimeout(onClose, 1500);
    } catch (error) {
      const logContext = {
        event: "trade_confirm_failed",
        traceId,
        quoteId: quote.quoteId,
        attemptId: currentAttempt?.id,
        error: serializeError(error),
      };
      if (error instanceof ClobOrderError) {
        logger.warn(logContext);
      } else {
        logger.error(logContext);
      }
      if (currentAttempt) {
        await submitOrderError(currentAttempt.id, error);
      }
      setLocalError(error instanceof Error ? error.message : "Trade failed");
      setQuote(null);
      setStep("quote");
    }
  };

  const submitOrderError = async (attemptId: string, error: unknown) => {
    try {
      const token = await readPrivyAccessToken(getAccessToken);
      await fetch(`/api/trade-attempts/${attemptId}/order-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-trace-id": traceId,
        },
        body: JSON.stringify({
          status: "error",
          error:
            error instanceof ClobOrderError
              ? {
                  message: error.message,
                  name: error.name,
                  response: error.response,
                }
              : error instanceof Error
                ? { message: error.message, name: error.name }
              : { message: "Unknown order error" },
        }),
      });
    } catch {
      // Keep the original error visible to the user.
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && step === "quote") {
      onClose();
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-white/10 shadow-2xl animate-modal-fade-in"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{marketTitle}</h3>
                <p className="text-sm text-blue-400">
                  {t("buying")}: {outcome}
                </p>
            </div>
            <button
              onClick={onClose}
              disabled={step !== "quote"}
              className="text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              x
            </button>
          </div>

          {step === "done" && (
            <div className={cn("mb-4", SUCCESS_STYLES)}>
              <p className="text-green-300 font-medium text-sm">
                {t("orderSubmitted")}
              </p>
            </div>
          )}

          {displayError && (
            <div className="mb-4 bg-red-500/20 border border-red-500/40 rounded-lg p-3">
              <p className="text-red-300 text-sm">{displayError}</p>
            </div>
          )}

          <div className="mb-4 bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">
              {t("currentMarketPrice")}
            </p>
            <p className="text-lg font-bold">{Math.round(currentPrice * 100)}¢</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              {t("totalPayment")}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={totalPayment}
              onChange={(event) => {
                if (/^\d*(\.\d{0,6})?$/.test(event.target.value)) {
                  setTotalPayment(event.target.value);
                  setQuote(null);
                  setLocalError(null);
                }
              }}
              placeholder="100.00"
              disabled={step !== "quote"}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            />
          </div>

          {quote && <QuoteSummary quote={quote} t={t} />}

          <div className="mb-4 space-y-2 text-sm">
            <ProgressRow active={step === "fee"} done={step === "order" || step === "done"}>
              {t("feeStep")}
            </ProgressRow>
            <ProgressRow active={step === "order"} done={step === "done"}>
              {t("orderStep")}
            </ProgressRow>
          </div>

          {!quote ? (
            <button
              onClick={handleCreateQuote}
              disabled={isCreatingQuote || totalPaymentNum < 2 || !depositWalletAddress}
              className="btn btn-primary w-full py-3"
            >
              {isCreatingQuote ? `${t("creatingQuote")}...` : t("getFinalQuote")}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={isTransferring || isSubmitting || !clobClient}
              className="btn w-full bg-green-600 py-3 text-white hover:bg-green-500 active:bg-green-700"
            >
              {isTransferring || isSubmitting
                ? `${t("processing")}...`
                : t("payAndBuy", {
                    total: formatUsd(quote.totalAmountUsdcMicros),
                    order: formatUsd(quote.orderAmountUsdcMicros),
                  })}
            </button>
          )}

          <p className="text-xs text-yellow-400 mt-3 text-center">
            {t("polygonUsdcWarning")}
          </p>
        </div>
      </div>
    </Portal>
  );

  async function payFee(relay: RelayClient, currentQuote: Quote) {
    const result = await transferUsdc(relay, {
      recipient: currentQuote.feeWallet,
      amount: BigInt(currentQuote.feeAmountUsdcMicros),
      walletAddress: currentQuote.safeAddress,
    });

    if (typeof result === "string") return result;
    throw new Error("Fee transfer did not return a transaction hash");
  }
}

function QuoteSummary({
  quote,
  t,
}: {
  quote: Quote;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <div className="mb-4 bg-white/5 rounded-lg p-3 space-y-2 text-sm">
      <SummaryRow label={t("totalPayment")} value={formatUsd(quote.totalAmountUsdcMicros)} />
      <SummaryRow label={t("platformFee")} value={formatUsd(quote.feeAmountUsdcMicros)} />
      <SummaryRow label={t("orderAmount")} value={formatUsd(quote.orderAmountUsdcMicros)} />
      <SummaryRow label={t("estimatedShares")} value={quote.estimatedShares} />
      <SummaryRow label={t("bestAsk")} value={`$${quote.bestAsk}`} />
      <SummaryRow label={t("maxPrice")} value={`$${quote.worstPrice}`} />
      <SummaryRow label={t("feeRecipient")} value={shortAddress(quote.feeWallet)} />
      <SummaryRow label={t("tradingSafe")} value={shortAddress(quote.safeAddress)} />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-right break-all">{value}</span>
    </div>
  );
}

function ProgressRow({
  active,
  done,
  children,
}: {
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        done
          ? "border-green-500/40 bg-green-500/10 text-green-200"
          : active
            ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
            : "border-white/10 bg-white/5 text-gray-400"
      )}
    >
      {children}
    </div>
  );
}

function formatMicros(value: string) {
  const micros = BigInt(value);
  const whole = micros / 1_000_000n;
  const fraction = (micros % 1_000_000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function formatUsd(value: string) {
  return `$${Number(formatMicros(value)).toFixed(2)}`;
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

async function readPrivyAccessToken(getAccessToken: () => Promise<string | null>) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Missing Privy access token");
  }
  return token;
}
