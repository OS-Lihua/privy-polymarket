import { useState, useEffect, useCallback } from "react";
const GEOBLOCK_PROXY_URL = "/api/polymarket/geoblock";

export type GeoblockStatus = {
  blocked: boolean;
  ip: string;
  country: string;
  region: string;
};

type UseGeoblockReturn = {
  isBlocked: boolean;
  isLoading: boolean;
  error: Error | null;
  geoblockStatus: GeoblockStatus | null;
  recheckGeoblock: () => Promise<void>;
};

// This hook checks if the user is geoblocked from using Polymarket
// Integrators should use this to enforce the same geoblocking rules as Polymarket.com

export default function useGeoblock(): UseGeoblockReturn {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [geoblockStatus, setGeoblockStatus] = useState<GeoblockStatus | null>(
    null
  );

  const checkGeoblock = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_DISABLE_GEOBLOCK_FOR_DEMO === "true") {
      setGeoblockStatus(null);
      setIsBlocked(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(GEOBLOCK_PROXY_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        setGeoblockStatus(null);
        setIsBlocked(true);
        return;
      }

      const data: GeoblockStatus = await response.json();

      setGeoblockStatus(data);
      setIsBlocked(data.blocked);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to check geoblock");
      setError(error);

      setIsBlocked(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check geoblock on mount
  useEffect(() => {
    checkGeoblock();
  }, [checkGeoblock]);

  return {
    isBlocked,
    isLoading,
    error,
    geoblockStatus,
    recheckGeoblock: checkGeoblock,
  };
}
