import useAddressCopy from "@/hooks/useAddressCopy";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import useSafeDeployment from "@/hooks/useSafeDeployment";

import InfoTooltip from "@/components/shared/InfoTooltip";

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
    derivedSafeAddressFromEoa || null
  );
  const {
    copied: copiedDepositWallet,
    copyAddress: copyDepositWalletAddress,
  } = useAddressCopy(depositWalletAddress || null);

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10 min-w-72">
      <div className="flex flex-col gap-3">
        {/* EOA Wallet */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60 font-medium">
              {t("eoaWallet")}
            </span>
            <InfoTooltip text={t("eoaHelp")} />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 transition-all select-none font-mono text-sm w-full sm:w-auto text-center">
            {eoaAddress && formatAddress(eoaAddress)}
          </div>
        </div>

        {/* Display-only Safe address */}
        {derivedSafeAddressFromEoa && (
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-300 font-medium">
                {t("safeWallet")}
              </span>
              <InfoTooltip text={t("safeHelp")} />
            </div>
            <button
              onClick={copySafeAddress}
              className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-4 py-2 transition-all select-none cursor-pointer font-mono text-sm text-blue-300 hover:text-blue-200 w-full sm:w-auto text-center"
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
              <span className="text-sm text-emerald-300 font-medium">
                {t("depositWallet")}
              </span>
              <InfoTooltip text={t("depositWalletHelp")} />
            </div>
            <button
              onClick={copyDepositWalletAddress}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg px-4 py-2 transition-all select-none cursor-pointer font-mono text-sm text-emerald-300 hover:text-emerald-200 w-full sm:w-auto text-center"
            >
              {copiedDepositWallet
                ? t("copied")
                : formatAddress(depositWalletAddress)}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between pt-2 border-t border-white/10">
          <div className="relative group w-full sm:w-auto">
            <button
              disabled
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 transition-all select-none cursor-not-allowed font-medium w-full sm:w-auto text-center text-white/40"
            >
              <span className="line-through">{t("profile")}</span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-white/20 z-10 text-center">
              {t("profileUnavailable")}
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="btn btn-danger w-full sm:w-auto"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
