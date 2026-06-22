"use client";

import { ReactNode } from "react";
import QueryProvider from "./QueryProvider";
import WalletProvider from "./WalletProvider";
import TradingProvider from "./TradingProvider";
import { I18nProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-md rounded-lg border border-white/10 bg-white/5 p-6">
          <h1 className="text-lg font-semibold mb-2">Privy is not configured</h1>
          <p className="text-sm text-gray-400">
            Set NEXT_PUBLIC_PRIVY_APP_ID before running the trading app.
          </p>
        </div>
      </main>
    );
  }

  return (
    <I18nProvider>
      <WalletProvider>
        <QueryProvider>
          <TradingProvider>{children}</TradingProvider>
        </QueryProvider>
      </WalletProvider>
    </I18nProvider>
  );
}
