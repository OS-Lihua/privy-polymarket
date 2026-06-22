import { useMemo } from "react";
import {
  Chain,
  ClobClient,
  SignatureTypeV2,
} from "@polymarket/clob-client-v2";
import { useWallet } from "@/providers/WalletContext";

import { TradingSession } from "@/utils/session";
import { CLOB_API_URL } from "@/constants/polymarket";

// This hook creates the authenticated clobClient with the User API Credentials
// and the builder config credentials, but only after a trading session is initialized

export default function useClobClient(
  tradingSession: TradingSession | null,
  isTradingSessionComplete: boolean | undefined
) {
  const { eoaAddress, walletClient } = useWallet();

  const clobClient = useMemo(() => {
    if (
      !walletClient ||
      !eoaAddress ||
      !tradingSession?.depositWalletAddress ||
      !isTradingSessionComplete ||
      !tradingSession?.apiCredentials
    ) {
      return null;
    }

    // This is the persisted clobClient instance for creating and posting
    // orders for the user. CLOB V2 uses order domain version 2 and pUSD.
    return new ClobClient({
      host: CLOB_API_URL,
      chain: Chain.POLYGON,
      signer: walletClient,
      creds: tradingSession.apiCredentials,
      signatureType: SignatureTypeV2.POLY_1271,
      funderAddress: tradingSession.depositWalletAddress,
      useServerTime: false,
      retryOnError: true,
    });
  }, [
    eoaAddress,
    walletClient,
    isTradingSessionComplete,
    tradingSession?.apiCredentials,
    tradingSession?.depositWalletAddress,
  ]);

  return { clobClient };
}
