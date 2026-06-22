import { useQuery } from "@tanstack/react-query";
import type { CategoryId } from "@/constants/categories";
import { getCategoryById } from "@/constants/categories";

export type PolymarketMarket = {
  id: string;
  question: string;
  description?: string;
  slug: string;
  active: boolean;
  closed: boolean;
  icon?: string;
  image?: string;
  volume?: string;
  volume24hr?: string | number;
  liquidity?: string | number;
  spread?: string;
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  conditionId?: string;
  endDate?: string;
  endDateIso?: string;
  gameStartTime?: string;
  events?: any[];
  eventTitle?: string;
  eventSlug?: string;
  eventId?: string;
  eventIcon?: string;
  negRisk?: boolean;
  realtimePrices?: Record<
    string,
    {
      bidPrice: number;
      askPrice: number;
      midPrice: number;
      spread: number;
    }
  >;
  [key: string]: any;
};

interface UseMarketsOptions {
  limit?: number;
  categoryId?: CategoryId;
}

export default function useMarkets(options: UseMarketsOptions = {}) {
  const { limit = 10, categoryId = "trending" } = options;

  return useQuery({
    queryKey: ["high-volume-markets", limit, categoryId],
    queryFn: async (): Promise<PolymarketMarket[]> => {
      const category = getCategoryById(categoryId);
      let url = `/api/polymarket/markets?limit=${limit}`;

      if (category?.tagId) {
        url += `&tag_id=${category.tagId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch markets");
      }

      return response.json();
    },
    staleTime: 2_000,
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
