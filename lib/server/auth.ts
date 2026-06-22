import { NextRequest } from "next/server";
import {
  createPublicClient,
  getAddress,
  isAddress,
  http,
  zeroAddress,
} from "viem";
import { polygon } from "viem/chains";
import { PrivyClient } from "@privy-io/server-auth";
import {
  deriveBeaconDepositWallet,
  deriveSafe,
  deriveUupsDepositWallet,
} from "@polymarket/builder-relayer-client/dist/builder/derive";
import { getContractConfig } from "@polymarket/builder-relayer-client/dist/config";
import { getPolygonRpcUrl, POLYGON_CHAIN_ID } from "@/lib/server/config";

type AuthContext = {
  privyUserId: string;
};

type OwnershipInput = {
  eoaAddress: string;
  safeAddress: string;
};

let privyClient: PrivyClient | null = null;

export async function requirePrivyAuth(request: NextRequest): Promise<AuthContext> {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Privy server auth is not configured");
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("Missing Privy access token");
  }

  privyClient ??= new PrivyClient(appId, appSecret);
  const claims = await privyClient.verifyAuthToken(token);

  return {
    privyUserId: claims.userId,
  };
}

export async function verifySafeOwnership(input: OwnershipInput) {
  if (!isAddress(input.eoaAddress) || !isAddress(input.safeAddress)) {
    throw new Error("Invalid EOA or Safe address");
  }

  const eoaAddress = getAddress(input.eoaAddress);
  const safeAddress = getAddress(input.safeAddress);
  const config = getContractConfig(POLYGON_CHAIN_ID);
  const derivedSafe = getAddress(
    deriveSafe(eoaAddress, config.SafeContracts.SafeFactory)
  );

  if (derivedSafe !== safeAddress) {
    throw new Error("Safe address does not match the submitted EOA");
  }

  return {
    eoaAddress,
    safeAddress,
  };
}

export async function verifyDepositWalletOwnership(input: OwnershipInput) {
  if (!isAddress(input.eoaAddress) || !isAddress(input.safeAddress)) {
    throw new Error("Invalid EOA or trading wallet address");
  }

  const eoaAddress = getAddress(input.eoaAddress);
  const tradingWalletAddress = getAddress(input.safeAddress);
  const config = getContractConfig(POLYGON_CHAIN_ID).DepositWalletContracts;
  const derivedUupsWallet = getAddress(
    deriveUupsDepositWallet(
      eoaAddress,
      config.DepositWalletFactory,
      config.DepositWalletImplementation
    )
  );

  const beacon = await readDepositWalletFactoryBeacon(
    config.DepositWalletFactory
  );
  if (beacon === zeroAddress) {
    if (derivedUupsWallet !== tradingWalletAddress) {
      throw new Error("Trading wallet does not match the submitted EOA");
    }
    return { eoaAddress, safeAddress: tradingWalletAddress };
  }

  const isUupsWalletDeployed = await isContractDeployed(derivedUupsWallet);
  const expectedWallet = isUupsWalletDeployed
    ? derivedUupsWallet
    : getAddress(
        deriveBeaconDepositWallet(
          eoaAddress,
          config.DepositWalletFactory,
          beacon
        )
      );

  if (expectedWallet !== tradingWalletAddress) {
    throw new Error("Trading wallet does not match the submitted EOA");
  }

  return { eoaAddress, safeAddress: tradingWalletAddress };
}

const FACTORY_BEACON_SELECTOR = "0x49493a4d" as const;

async function readDepositWalletFactoryBeacon(factory: string) {
  try {
    const { data } = await polygonClient().call({
      to: getAddress(factory),
      data: FACTORY_BEACON_SELECTOR,
    });
    return getAddress(`0x${data?.slice(-40)}`);
  } catch {
    return zeroAddress;
  }
}

async function isContractDeployed(address: string) {
  const code = await polygonClient().getCode({
    address: getAddress(address),
  });
  return !!code && code !== "0x";
}

function polygonClient() {
  return createPublicClient({
    chain: polygon,
    transport: http(getPolygonRpcUrl()),
  });
}
