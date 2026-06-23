import { useMemo } from "react";
import { deriveSafe } from "@polymarket/builder-relayer-client/dist/builder/derive";
import { getContractConfig } from "@polymarket/builder-relayer-client/dist/config";
import { POLYGON_CHAIN_ID } from "@/constants/polymarket";

// Safe is retained only as a deterministic display address for demos.

export default function useSafeDeployment(eoaAddress?: string) {
  const derivedSafeAddressFromEoa = useMemo(() => {
    if (!eoaAddress || !POLYGON_CHAIN_ID) return undefined;

    try {
      const config = getContractConfig(POLYGON_CHAIN_ID);
      return deriveSafe(eoaAddress, config.SafeContracts.SafeFactory);
    } catch (err) {
      console.error("Error deriving Safe address:", err);
      return undefined;
    }
  }, [eoaAddress]);

  return {
    derivedSafeAddressFromEoa,
  };
}
