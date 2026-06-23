import useAddressCopy from "@/hooks/useAddressCopy";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";

import InfoTooltip from "@/components/shared/InfoTooltip";

import { formatAddress } from "@/utils/formatting";
import { useI18n } from "@/lib/i18n";

export default function WalletInfo() {
	const { eoaAddress } = useWallet();
	const { depositWalletAddress } = useTrading();
	const { t } = useI18n();
	const { copied: copiedDepositWallet, copyAddress: copyDepositWalletAddress } =
		useAddressCopy(depositWalletAddress || null);

	return (
		<div
			className="min-w-72 rounded-lg border border-border bg-panel p-3"
			data-tour="wallet-overview"
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground font-medium">
							{t("eoaWallet")}
						</span>
						<InfoTooltip text={t("eoaHelp")} />
					</div>
					<div className="rounded-md border border-border bg-background px-4 py-2 font-mono text-sm transition-all select-none w-full sm:w-auto text-center">
						{eoaAddress && formatAddress(eoaAddress)}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm text-success font-medium">
							{t("depositWallet")}
						</span>
						<InfoTooltip text={t("depositWalletHelp")} />
					</div>
					{depositWalletAddress ? (
						<button
							type="button"
							onClick={copyDepositWalletAddress}
							className="w-full rounded-md border border-success/25 bg-success/10 px-4 py-2 text-center font-mono text-sm text-success transition-colors select-none hover:bg-success/15 sm:w-auto"
						>
							{copiedDepositWallet
								? t("copied")
								: formatAddress(depositWalletAddress)}
						</button>
					) : (
						<div className="w-full rounded-md border border-warning/25 bg-warning/10 px-4 py-2 text-center text-sm font-medium text-warning sm:w-auto">
							{t("depositWalletPending")}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
