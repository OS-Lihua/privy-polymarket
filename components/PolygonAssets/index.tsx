"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import useWrapUsdcToPusd from "@/hooks/useWrapUsdcToPusd";

import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import TransferModal from "@/components/PolygonAssets/TransferModal";
import { formatAddress } from "@/utils/formatting";
import { useI18n } from "@/lib/i18n";
import { USDC_E_DECIMALS } from "@/constants/tokens";

export default function PolygonAssets() {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [wrapError, setWrapError] = useState<string | null>(null);
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { eoaAddress } = useWallet();
  const { relayClient, depositWalletAddress } = useTrading();
  const {
    formattedPusdBalance,
    formattedUsdcBalance,
    usdcBalance,
    isLoading,
    isError,
    error,
  } = usePolygonBalances(depositWalletAddress);
  const { isWrapping, error: wrapHookError, wrapUsdcToPusd } =
    useWrapUsdcToPusd();

  const handleWrapAll = async () => {
    if (!relayClient || !depositWalletAddress || usdcBalance <= 0) {
      setWrapError(t("startSessionFirst"));
      return;
    }

    try {
      setWrapError(null);
      await wrapUsdcToPusd(relayClient, {
        walletAddress: depositWalletAddress as `0x${string}`,
        amount: parseUnits(String(usdcBalance), USDC_E_DECIMALS),
      });
      await queryClient.invalidateQueries({ queryKey: ["polygon-balances"] });
    } catch (err) {
      setWrapError(err instanceof Error ? err.message : "Failed to wrap");
    }
  };

  if (!eoaAddress || !depositWalletAddress) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t("tradingBalance")}</h2>
        <p className="text-center text-white/70" data-tour="deposit-balance">
          {t("loadingBalance")}
        </p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t("tradingBalance")}</h2>
        <p className="text-center text-red-400 mb-3" data-tour="deposit-balance">
          {t("errorLoadingBalance")}
        </p>
        <p className="text-center text-xs text-white/50 mb-3" data-tour="safe-address">
          {t("safeRechargeAddress")}: {formatAddress(depositWalletAddress)}
        </p>
        {error && (
          <p className="text-center text-xs text-red-300 break-words">
            {error instanceof Error ? error.message : String(error)}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t("tradingBalance")}</h2>
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="btn btn-secondary"
        >
          {t("send")}
        </button>
      </div>

      <div className="bg-white/5 rounded-lg p-6 text-center" data-tour="deposit-balance">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-white/70">pUSD</h3>
          <Badge className="text-xs px-2 py-1">Polygon</Badge>
        </div>

        <p className="text-5xl font-bold">${formattedPusdBalance}</p>
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-left">
              <p className="text-xs text-white/50">{t("availableUsdcE")}</p>
              <p className="text-sm font-semibold text-white">
                {formattedUsdcBalance} USDC.e
              </p>
            </div>
            <button
              type="button"
              onClick={handleWrapAll}
              disabled={isWrapping || usdcBalance <= 0}
              className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isWrapping ? t("wrapping") : t("wrapToPusd")}
            </button>
          </div>
          {(wrapError || wrapHookError) && (
            <p className="mt-2 text-left text-xs text-red-300">
              {wrapError || wrapHookError?.message}
            </p>
          )}
        </div>

        <p className="text-xs text-white/50 mt-3" data-tour="safe-address">
          {t("depositWalletAddress")}: {formatAddress(depositWalletAddress)}
        </p>
      </div>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </Card>
  );
}
