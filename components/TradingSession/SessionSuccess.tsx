import type { TradingSession } from "@/utils/session";
import { useI18n } from "@/lib/i18n";

export default function SessionSuccess({
  session,
}: {
  session: TradingSession;
}) {
  const { t } = useI18n();

  return (
    <div className="text-sm text-gray-300 bg-green-500/10 border border-green-500/20 rounded p-4 mb-4">
      <p className="font-medium mb-2">{t("readyToTrade")}</p>
      <div className="text-xs leading-relaxed text-gray-400 space-y-1">
        <ul className="space-y-1 ml-4 list-disc">
          <li>
            {t("depositWallet")}:{" "}
            {session.depositWalletAddress}
          </li>
          <li>{t("sessionCredentials")}</li>
          <li>{t("sessionApprovals")}</li>
        </ul>
      </div>
    </div>
  );
}
