"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@/providers/WalletContext";
import WalletInfo from "@/components/Header/WalletInfo";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/classNames";

export default function Header({
  onEndSession,
}: {
  onEndSession?: () => void;
}) {
  const { eoaAddress } = useWallet();
  const { login, logout } = usePrivy();
  const { language, setLanguage, t } = useI18n();

  const handleConnect = async () => {
    login();
  };

  const handleDisconnect = async () => {
    onEndSession?.();
    logout();
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="pt-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("appTitle")}
        </h1>
      </div>
      <div className="flex items-start gap-3 ml-auto">
        <div
          className="flex rounded-md border border-white/10 bg-white/5 p-1"
          aria-label={t("language")}
        >
          <button
            type="button"
            onClick={() => setLanguage("zh")}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors",
              language === "zh"
                ? "bg-white/15 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            {t("chinese")}
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors",
              language === "en"
                ? "bg-white/15 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            {t("english")}
          </button>
        </div>
        {eoaAddress ? (
          <WalletInfo onDisconnect={handleDisconnect} />
        ) : (
          <button className="btn btn-primary" onClick={handleConnect}>
            {t("login")}
          </button>
        )}
      </div>
    </div>
  );
}
