import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import type { BuilderApiKeyCreds } from "@polymarket/builder-signing-sdk";
import { requirePrivyAuth } from "@/lib/server/auth";
import { saveUserBuilderCredentials } from "@/lib/server/builder-credentials";

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePrivyAuth(request);
    const body = await request.json();
    const eoaAddress = readAddress(body.eoaAddress);
    const builderCreds = readBuilderCreds(body.builderCreds);

    await saveUserBuilderCredentials({
      privyUserId: auth.privyUserId,
      eoaAddress,
      builderCreds,
    });

    return NextResponse.json({ configured: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save builder credentials",
      },
      { status: 400 }
    );
  }
}

function readAddress(value: unknown) {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error("Valid eoaAddress is required");
  }

  return getAddress(value);
}

function readBuilderCreds(value: unknown): BuilderApiKeyCreds {
  if (!value || typeof value !== "object") {
    throw new Error("builderCreds is required");
  }

  const record = value as Record<string, unknown>;
  const key = readNonEmptyString(record.key, "builderCreds.key");
  const secret = readNonEmptyString(record.secret, "builderCreds.secret");
  const passphrase = readNonEmptyString(
    record.passphrase,
    "builderCreds.passphrase"
  );

  return { key, secret, passphrase };
}

function readNonEmptyString(value: unknown, name: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}
