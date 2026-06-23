import { useState, useCallback, useEffect } from "react";
import useRelayClient from "@/hooks/useRelayClient";
import { useWallet } from "@/providers/WalletContext";
import useTokenApprovals from "@/hooks/useTokenApprovals";
import useDepositWallet from "@/hooks/useDepositWallet";
import useUserApiCredentials from "@/hooks/useUserApiCredentials";
import {
  loadSession,
  saveSession,
  clearSession as clearStoredSession,
  TradingSession,
  SessionStep,
} from "@/utils/session";
import { APPROVAL_SCHEMA_VERSION } from "@/utils/approvals";

// This is the coordination hook that manages the user's trading session
// It orchestrates the steps for initializing both the clob and relay clients
// It creates, stores, and loads the user's L2 credentials for the trading session (API credentials)
// It deploys the Deposit Wallet and sets token approvals for the CTF Exchange

export default function useTradingSession() {
  const [currentStep, setCurrentStep] = useState<SessionStep>("idle");
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const [tradingSession, setTradingSession] = useState<TradingSession | null>(
    null
  );

  const { eoaAddress, walletClient } = useWallet();
  const {
    createOrDeriveUserApiCredentials,
    createAndStoreBuilderCredentials,
    hasStoredBuilderCredentials,
  } = useUserApiCredentials();
  const { checkAllTokenApprovals, setAllTokenApprovals } = useTokenApprovals();
  const { relayClient, initializeRelayClient, clearRelayClient } =
    useRelayClient();
  const {
    deriveDepositWalletAddress,
    isDepositWalletDeployed,
    deployDepositWallet,
  } = useDepositWallet(relayClient);

  // Always check for an existing trading session after wallet is connected by checking
  // session object from localStorage to track the status of the user's trading session
  useEffect(() => {
    if (!eoaAddress) {
      setTradingSession(null);
      setCurrentStep("idle");
      setSessionError(null);
      return;
    }

    const stored = loadSession(eoaAddress);
    setTradingSession(stored);

    if (!stored) {
      setCurrentStep("idle");
      setSessionError(null);
      return;
    }
  }, [eoaAddress]);

  // Restores the relay client when session exists
  useEffect(() => {
    if (tradingSession && !relayClient && eoaAddress && walletClient) {
      initializeRelayClient().catch((err) => {
        console.error("Failed to restore relay client:", err);
      });
    }
  }, [
    tradingSession,
    relayClient,
    eoaAddress,
    walletClient,
    initializeRelayClient,
  ]);

  // The core function that orchestrates the trading session initialization
  const initializeTradingSession = useCallback(async () => {
    if (!eoaAddress) throw new Error("Wallet not connected");

    setCurrentStep("checking");
    setSessionError(null);

    try {
      // Step 1: Get User API Credentials (derive or create), then use them to
      // create Builder credentials and store them encrypted on the server.
      let apiCreds = tradingSession?.apiCredentials;
      if (
        !tradingSession?.hasApiCredentials ||
        !apiCreds ||
        !apiCreds.key ||
        !apiCreds.secret ||
        !apiCreds.passphrase
      ) {
        setCurrentStep("credentials");
        apiCreds = await createOrDeriveUserApiCredentials();
      }
      if (!(await hasStoredBuilderCredentials())) {
        await createAndStoreBuilderCredentials(apiCreds);
      }

      // Step 2: Initializes relayClient with the ethers signer and
      // per-user Builder credentials (via remote signing server).
      const initializedRelayClient = await initializeRelayClient();

      // Step 3: Set up Deposit Wallet
      setCurrentStep("depositWallet");
      const depositWalletAddress =
        (await initializedRelayClient.deriveDepositWalletAddress()) ||
        (await deriveDepositWalletAddress());

      if (!depositWalletAddress) {
        throw new Error("Failed to derive deposit wallet address");
      }

      const depositWalletDeployed =
        await isDepositWalletDeployed(depositWalletAddress);
      if (!depositWalletDeployed) {
        await deployDepositWallet(initializedRelayClient);
      }

      // Step 4: Set all required token approvals for trading
      setCurrentStep("approvals");
      const approvalStatus = await checkAllTokenApprovals(
        depositWalletAddress
      );

      let hasApprovals = false;
      if (approvalStatus.allApproved) {
        hasApprovals = true;
      } else {
        hasApprovals = await setAllTokenApprovals(
          initializedRelayClient,
          depositWalletAddress
        );
      }

      // Step 5: Create custom session object
      const newSession: TradingSession = {
        eoaAddress: eoaAddress,
        depositWalletAddress,
        approvalSchemaVersion: APPROVAL_SCHEMA_VERSION,
        isDepositWalletDeployed: true,
        hasApiCredentials: true,
        hasApprovals,
        apiCredentials: apiCreds,
        lastChecked: Date.now(),
      };

      setTradingSession(newSession);
      saveSession(eoaAddress, newSession);

      setCurrentStep("complete");
    } catch (err) {
      console.error("Session initialization error:", err);
      const error = err instanceof Error ? err : new Error("Unknown error");
      setSessionError(error);
      setCurrentStep("idle");
    }
  }, [
    eoaAddress,
    initializeRelayClient,
    tradingSession,
    createOrDeriveUserApiCredentials,
    createAndStoreBuilderCredentials,
    hasStoredBuilderCredentials,
    checkAllTokenApprovals,
    setAllTokenApprovals,
    deriveDepositWalletAddress,
    isDepositWalletDeployed,
    deployDepositWallet,
  ]);

  // This function clears the trading session and resets the state
  const endTradingSession = useCallback(() => {
    if (!eoaAddress) return;

    clearStoredSession(eoaAddress);
    setTradingSession(null);
    clearRelayClient();
    setCurrentStep("idle");
    setSessionError(null);
  }, [eoaAddress, clearRelayClient]);

  return {
    tradingSession,
    currentStep,
    sessionError,
    isTradingSessionComplete:
      tradingSession?.isDepositWalletDeployed &&
      tradingSession?.depositWalletAddress &&
      tradingSession?.hasApiCredentials &&
      tradingSession?.hasApprovals &&
      tradingSession?.approvalSchemaVersion === APPROVAL_SCHEMA_VERSION,
    initializeTradingSession,
    endTradingSession,
    relayClient,
  };
}
