import useAddressCopy from "@/hooks/useAddressCopy";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import useSafeDeployment from "@/hooks/useSafeDeployment";

import InfoTooltip from "@/components/shared/InfoTooltip";
import { Button } from "@/components/ui/button";

import { formatAddress } from "@/utils/formatting";
import { useI18n } from "@/lib/i18n";

export default function WalletInfo({
	onDisconnect,
}: {
	onDisconnect: () => void;
}) {
	const { eoaAddress } = useWallet();
	const { depositWalletAddress } = useTrading();
	const { t } = useI18n();
	const { derivedSafeAddressFromEoa } = useSafeDeployment(eoaAddress);
	const { copied: copiedSafe, copyAddress: copySafeAddress } = useAddressCopy(
		derivedSafeAddressFromEoa || null,
	);
	const { copied: copiedDepositWallet, copyAddress: copyDepositWalletAddress } =
		useAddressCopy(depositWalletAddress || null);

	return (
		<div className="min-w-72 rounded-lg border border-border bg-panel p-3">
			<div className="flex flex-col gap-3">
				{/* EOA Wallet */}
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

				{/* Display-only Safe address */}
				{derivedSafeAddressFromEoa && (
					<div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm text-primary font-medium">
								{t("safeWallet")}
							</span>
							<InfoTooltip text={t("safeHelp")} />
						</div>
						<button
							onClick={copySafeAddress}
							className="w-full rounded-md border border-primary/25 bg-primary/10 px-4 py-2 text-center font-mono text-sm text-primary transition-colors select-none hover:bg-primary/15 sm:w-auto"
						>
							{copiedSafe
								? t("copied")
								: formatAddress(derivedSafeAddressFromEoa)}
						</button>
					</div>
				)}

				{depositWalletAddress && (
					<div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm text-success font-medium">
								{t("depositWallet")}
							</span>
							<InfoTooltip text={t("depositWalletHelp")} />
						</div>
						<button
							onClick={copyDepositWalletAddress}
							className="w-full rounded-md border border-success/25 bg-success/10 px-4 py-2 text-center font-mono text-sm text-success transition-colors select-none hover:bg-success/15 sm:w-auto"
						>
							{copiedDepositWallet
								? t("copied")
								: formatAddress(depositWalletAddress)}
						</button>
					</div>
				)}

				{/* Action buttons */}
				<div className="flex flex-col sm:flex-row items-center gap-3 justify-between pt-2 border-t border-border">
					<div className="relative group w-full sm:w-auto">
						<button
							disabled
							className="w-full rounded-md border border-border bg-muted px-4 py-2 text-center font-medium text-muted-foreground opacity-60 cursor-not-allowed sm:w-auto"
						>
							<span className="line-through">{t("profile")}</span>
						</button>
						<div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 rounded-md border border-border bg-popover px-3 py-2 text-center text-xs text-popover-foreground shadow-md z-10">
							{t("profileUnavailable")}
						</div>
					</div>
					<Button
						onClick={onDisconnect}
						variant="destructive"
						className="w-full sm:w-auto"
					>
						{t("logout")}
					</Button>
				</div>
			</div>
		</div>
	);
}
