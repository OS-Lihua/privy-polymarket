import type { BuilderApiKeyCreds } from "@polymarket/builder-signing-sdk";
import { prisma } from "@/lib/server/prisma";
import { decryptSecret, encryptSecret } from "@/lib/server/crypto";

export async function saveUserBuilderCredentials(input: {
  privyUserId: string;
  eoaAddress: string;
  builderCreds: BuilderApiKeyCreds;
}) {
  return prisma.userBuilderCredential.upsert({
    where: { privyUserId: input.privyUserId },
    create: {
      privyUserId: input.privyUserId,
      eoaAddress: input.eoaAddress,
      keyCiphertext: encryptSecret(input.builderCreds.key),
      secretCiphertext: encryptSecret(input.builderCreds.secret),
      passphraseCiphertext: encryptSecret(input.builderCreds.passphrase),
    },
    update: {
      eoaAddress: input.eoaAddress,
      keyCiphertext: encryptSecret(input.builderCreds.key),
      secretCiphertext: encryptSecret(input.builderCreds.secret),
      passphraseCiphertext: encryptSecret(input.builderCreds.passphrase),
    },
  });
}

export async function getUserBuilderCredentials(privyUserId: string) {
  const stored = await prisma.userBuilderCredential.findUnique({
    where: { privyUserId },
  });

  if (!stored) return null;

  return {
    key: decryptSecret(stored.keyCiphertext),
    secret: decryptSecret(stored.secretCiphertext),
    passphrase: decryptSecret(stored.passphraseCiphertext),
  } satisfies BuilderApiKeyCreds;
}
