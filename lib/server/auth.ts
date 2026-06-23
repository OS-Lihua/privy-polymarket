import { NextRequest } from "next/server";
import {
  createPublicClient,
  getAddress,
  isAddress,
  zeroAddress,
} from "viem";
import { polygon } from "viem/chains";
import { PrivyClient } from "@privy-io/server-auth";
import {
  deriveBeaconDepositWallet,
  deriveUupsDepositWallet,
} from "@polymarket/builder-relayer-client/dist/builder/derive";
import { getContractConfig } from "@polymarket/builder-relayer-client/dist/config";
import { POLYGON_CHAIN_ID } from "@/lib/server/config";
import { serverPolygonTransport } from "@/lib/server/polygonTransport";

type AuthContext = {
  privyUserId: string;
};

type OwnershipInput = {
  eoaAddress: string;
  depositWalletAddress: string;
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

export async function verifyDepositWalletOwnership(input: OwnershipInput) {
  if (!isAddress(input.eoaAddress) || !isAddress(input.depositWalletAddress)) {
    throw new Error("Invalid EOA or trading wallet address");
  }

  const eoaAddress = getAddress(input.eoaAddress);
  const tradingWalletAddress = getAddress(input.depositWalletAddress);
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
    return { eoaAddress, depositWalletAddress: tradingWalletAddress };
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

  return { eoaAddress, depositWalletAddress: tradingWalletAddress };
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
    transport: serverPolygonTransport(),
  });
}
