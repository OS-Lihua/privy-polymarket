import { describe, expect, it } from "vitest";
import { http } from "viem";
import { polygonChainWithRpc } from "@/utils/polygonChain";

describe("polygonChainWithRpc", () => {
  it("sets viem and Privy Polygon RPC URLs to the configured endpoint", () => {
    const rpcUrl = "https://example.invalid/polygon";
    const chain = polygonChainWithRpc(rpcUrl);

    expect(chain.rpcUrls.default.http[0]).toBe(rpcUrl);
    expect(chain.rpcUrls.public.http[0]).toBe(rpcUrl);
    expect(chain.rpcUrls.privyWalletOverride?.http[0]).toBe(rpcUrl);
    expect(http()({ chain }).value?.url).toBe(rpcUrl);
  });
});
