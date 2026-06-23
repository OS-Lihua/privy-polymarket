import { addRpcUrlOverrideToChain } from "@privy-io/chains";
import type { Chain } from "viem";
import { polygon } from "viem/chains";
import { POLYGON_RPC_URL } from "@/constants/polymarket";

export function polygonChainWithRpc(rpcUrl = POLYGON_RPC_URL): Chain {
  const chain = addRpcUrlOverrideToChain(polygon, rpcUrl);

  return {
    ...chain,
    rpcUrls: {
      ...chain.rpcUrls,
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
  };
}
