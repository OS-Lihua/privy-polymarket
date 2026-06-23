-- CreateTable
CREATE TABLE "UserBuilderCredential" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "eoaAddress" TEXT NOT NULL,
    "keyCiphertext" TEXT NOT NULL,
    "secretCiphertext" TEXT NOT NULL,
    "passphraseCiphertext" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBuilderCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBuilderCredential_privyUserId_key" ON "UserBuilderCredential"("privyUserId");

-- CreateIndex
CREATE INDEX "UserBuilderCredential_eoaAddress_idx" ON "UserBuilderCredential"("eoaAddress");
