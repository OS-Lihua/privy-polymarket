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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BridgeDepositModal from "@/components/PolygonAssets/BridgeDepositModal";
import TransferModal from "@/components/PolygonAssets/TransferModal";
import { formatAddress } from "@/utils/formatting";
import { useI18n } from "@/lib/i18n";
import { USDC_E_DECIMALS } from "@/constants/tokens";

export default function PolygonAssets() {
	const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
	const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
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
	const {
		isWrapping,
		error: wrapHookError,
		wrapUsdcToPusd,
	} = useWrapUsdcToPusd();

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
			<Card className="p-5">
				<h2 className="text-xl font-semibold mb-4">{t("tradingBalance")}</h2>
				<Skeleton className="h-28 w-full" data-tour="deposit-balance" />
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="p-5">
				<h2 className="text-xl font-semibold mb-4">{t("tradingBalance")}</h2>
				<p
					className="text-center text-destructive mb-3"
					data-tour="deposit-balance"
				>
					{t("errorLoadingBalance")}
				</p>
				<p
					className="text-center text-xs text-muted-foreground mb-3"
					data-tour="deposit-wallet-address"
				>
					{t("depositRechargeAddress")}: {formatAddress(depositWalletAddress)}
				</p>
				{error && (
					<p className="text-center text-xs text-destructive break-words">
						{error instanceof Error ? error.message : String(error)}
					</p>
				)}
			</Card>
		);
	}

	return (
		<Card className="p-5">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">
						{t("tradingBalance")}
					</h2>
					<p className="text-sm text-muted-foreground">
						Deposit wallet liquidity for CLOB orders.
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={() => setIsBridgeModalOpen(true)} variant="default">
						Deposit
					</Button>
					<Button
						onClick={() => setIsTransferModalOpen(true)}
						variant="secondary"
					>
						{t("send")}
					</Button>
				</div>
			</div>

			<div
				className="rounded-lg border border-border bg-panel p-5 text-center"
				data-tour="deposit-balance"
			>
				<div className="flex items-center justify-center gap-2 mb-2">
					<h3 className="text-lg font-semibold text-muted-foreground">pUSD</h3>
					<Badge className="text-xs px-2 py-1">Polygon</Badge>
				</div>

				<p className="text-4xl font-semibold tracking-tight sm:text-5xl">
					${formattedPusdBalance}
				</p>
				<div className="mt-4 rounded-lg border border-border bg-card p-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-left">
							<p className="text-xs text-muted-foreground">
								{t("availableUsdcE")}
							</p>
							<p className="text-sm font-semibold text-foreground">
								{formattedUsdcBalance} USDC.e
							</p>
						</div>
						<Button
							type="button"
							onClick={handleWrapAll}
							disabled={isWrapping || usdcBalance <= 0}
							variant="secondary"
							loading={isWrapping}
						>
							{isWrapping ? t("wrapping") : t("wrapToPusd")}
						</Button>
					</div>
					{(wrapError || wrapHookError) && (
						<p className="mt-2 text-left text-xs text-destructive">
							{wrapError || wrapHookError?.message}
						</p>
					)}
				</div>

				<p
					className="text-xs text-muted-foreground mt-3"
				data-tour="deposit-wallet-address"
				>
					{t("depositWalletAddress")}: {formatAddress(depositWalletAddress)}
				</p>
			</div>

			<TransferModal
				isOpen={isTransferModalOpen}
				onClose={() => setIsTransferModalOpen(false)}
			/>
			<BridgeDepositModal
				isOpen={isBridgeModalOpen}
				onClose={() => setIsBridgeModalOpen(false)}
				depositWalletAddress={depositWalletAddress}
			/>
		</Card>
	);
}
