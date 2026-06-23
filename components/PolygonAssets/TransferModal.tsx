"use client";

import { useState, useEffect, useRef } from "react";
import useUsdcTransfer from "@/hooks/useUsdcTransfer";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";

import Portal from "@/components/Portal";

import { PUSD_DECIMALS } from "@/constants/tokens";
import { SUCCESS_STYLES } from "@/constants/ui";
import { cn } from "@/utils/classNames";
import { parseUnits } from "viem";

type TransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const { relayClient, depositWalletAddress } = useTrading();
  const { isTransferring, error, transferUsdc } = useUsdcTransfer();
  const { formattedPusdBalance, rawPusdBalance } =
    usePolygonBalances(depositWalletAddress);

  useEffect(() => {
    if (isOpen) {
      setRecipient("");
      setAmount("");
      setShowSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTransfer = async () => {
    if (!relayClient || !depositWalletAddress || !recipient || !amount) return;

    try {
      const amountBigInt = parseUnits(amount, PUSD_DECIMALS);
      await transferUsdc(relayClient, {
        recipient: recipient as `0x${string}`,
        amount: amountBigInt,
        walletAddress: depositWalletAddress,
      });
      setShowSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Transfer failed:", err);
    }
  };

  const handleSendMax = () => {
    if (rawPusdBalance) {
      setAmount((Number(rawPusdBalance) / 10 ** PUSD_DECIMALS).toString());
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-card text-card-foreground rounded-lg p-6 max-w-md w-full border border-border shadow-lg animate-modal-fade-in"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold">Send pUSD</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className={cn("mb-4", SUCCESS_STYLES)}>
              <p className="text-success font-medium text-sm">
                Transfer successful!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/25 rounded-lg p-3">
              <p className="text-destructive text-sm">{error.message}</p>
            </div>
          )}

          {/* Balance Display */}
          <div className="mb-4 bg-panel border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
            <p className="text-lg font-bold">${formattedPusdBalance} pUSD</p>
          </div>

          {/* Recipient Input */}
          <div className="mb-4">
            <label className="block text-sm text-muted-foreground mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground font-mono text-sm"
              disabled={isTransferring}
            />
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-2">
              Amount (pUSD)
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 pr-16 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                disabled={isTransferring}
              />
              <button
                type="button"
                onClick={handleSendMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-primary hover:bg-primary/90 rounded text-primary-foreground"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleTransfer}
            disabled={isTransferring || !recipient || !amount || !relayClient}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-md transition-colors"
          >
            {isTransferring ? "Sending..." : "Send pUSD"}
          </button>

          {!relayClient && (
            <p className="text-xs text-warning mt-2 text-center">
              Start a trading session first
            </p>
          )}
        </div>
      </div>
    </Portal>
  );
}
