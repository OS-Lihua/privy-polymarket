-- CreateTable
CREATE TABLE "TradeAttempt" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "eoaAddress" TEXT NOT NULL,
    "safeAddress" TEXT NOT NULL,
    "marketId" TEXT,
    "tokenId" TEXT NOT NULL,
    "outcome" TEXT,
    "negRisk" BOOLEAN NOT NULL,
    "totalAmountUsdcMicros" BIGINT NOT NULL,
    "feeRateBps" INTEGER NOT NULL,
    "feeAmountUsdcMicros" BIGINT NOT NULL,
    "orderAmountUsdcMicros" BIGINT NOT NULL,
    "slippageBps" INTEGER NOT NULL,
    "bestAsk" DECIMAL(65,30),
    "worstPrice" DECIMAL(65,30) NOT NULL,
    "tickSize" DECIMAL(65,30) NOT NULL,
    "estimatedShares" DECIMAL(65,30),
    "status" TEXT NOT NULL,
    "feeWallet" TEXT NOT NULL,
    "feeTxHash" TEXT,
    "feeCollectedAt" TIMESTAMP(3),
    "feeRetainedAt" TIMESTAMP(3),
    "polymarketOrderId" TEXT,
    "clientOrderResponseJson" JSONB,
    "clientOrderErrorJson" JSONB,
    "clientReportedStatus" TEXT,
    "clientReportedAt" TIMESTAMP(3),
    "refundTxHash" TEXT,
    "refundedAt" TIMESTAMP(3),
    "quoteSnapshotJson" JSONB NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeAttempt_privyUserId_status_idx" ON "TradeAttempt"("privyUserId", "status");

-- CreateIndex
CREATE INDEX "TradeAttempt_safeAddress_idx" ON "TradeAttempt"("safeAddress");

-- CreateIndex
CREATE INDEX "TradeAttempt_feeTxHash_idx" ON "TradeAttempt"("feeTxHash");

-- CreateIndex
CREATE INDEX "TradeAttempt_polymarketOrderId_idx" ON "TradeAttempt"("polymarketOrderId");
