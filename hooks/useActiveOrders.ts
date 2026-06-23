import { useQuery } from "@tanstack/react-query";
import type { ClobClient } from "@polymarket/clob-client-v2";

export type PolymarketOrder = {
  id: string;
  status: string;
  owner: string;
  maker_address: string;
  market: string;
  asset_id: string;
  side: "BUY" | "SELL";
  original_size: string;
  size_matched: string;
  price: string;
  associate_trades: string[];
  outcome: string;
  created_at: number;
  expiration: string;
  order_type: string;
};

export default function useActiveOrders(
  clobClient: ClobClient | null,
  walletAddress: string | undefined
) {
  return useQuery({
    queryKey: ["active-orders", walletAddress],
    queryFn: async (): Promise<PolymarketOrder[]> => {
      if (!clobClient || !walletAddress) {
        return [];
      }

      try {
        const allOrders = normalizeOpenOrders(await clobClient.getOpenOrders());

        const userOrders = allOrders.filter((order) => {
          const orderMaker = (order.maker_address || "").toLowerCase();
          const userAddr = walletAddress.toLowerCase();
          return orderMaker === userAddr;
        });

        const activeOrders = userOrders.filter((order) => {
          return order.status === "LIVE";
        });

        return activeOrders;
      } catch {
        return [];
      }
    },
    enabled: !!clobClient && !!walletAddress,
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

function normalizeOpenOrders(response: unknown): PolymarketOrder[] {
  if (Array.isArray(response)) return response as PolymarketOrder[];

  const data = (response as { data?: unknown } | undefined)?.data;
  if (Array.isArray(data)) return data as PolymarketOrder[];

  return [];
}
