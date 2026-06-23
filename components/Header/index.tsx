"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@/providers/WalletContext";
import WalletInfo from "@/components/Header/WalletInfo";
import ThemeToggle from "@/components/Header/ThemeToggle";
import { Button } from "@/components/ui/button";
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
    <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Deposit wallet trading demo
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("appTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review session readiness, balances, markets, orders, and positions from one workbench.
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-3 lg:ml-auto lg:flex-row lg:items-start">
        <div
          className="flex rounded-md border border-border bg-muted p-1"
          aria-label={t("language")}
        >
          <button
            type="button"
            onClick={() => setLanguage("zh")}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors",
              language === "zh"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("english")}
          </button>
        </div>
        <ThemeToggle />
        {eoaAddress ? (
          <WalletInfo onDisconnect={handleDisconnect} />
        ) : (
          <Button onClick={handleConnect}>
            {t("login")}
          </Button>
        )}
      </div>
    </header>
  );
}
