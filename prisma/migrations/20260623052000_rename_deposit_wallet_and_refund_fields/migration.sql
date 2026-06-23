-- Rename legacy Safe column to the current Deposit Wallet terminology.
ALTER TABLE "TradeAttempt" RENAME COLUMN "safeAddress" TO "depositWalletAddress";

ALTER INDEX IF EXISTS "TradeAttempt_safeAddress_idx" RENAME TO "TradeAttempt_depositWalletAddress_idx";

-- Refund accounting for user-triggered cancellation after fee collection.
ALTER TABLE "TradeAttempt"
  ADD COLUMN "refundGrossUsdcMicros" BIGINT,
  ADD COLUMN "refundGasFeeUsdcMicros" BIGINT,
  ADD COLUMN "refundNetUsdcMicros" BIGINT,
  ADD COLUMN "refundGasEstimateJson" JSONB,
  ADD COLUMN "refundErrorMessage" TEXT;
