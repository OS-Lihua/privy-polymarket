"use client";

import { GeoblockStatus } from "@/hooks/useGeoblock";
import { useI18n } from "@/lib/i18n";

interface GeoBlockedBannerProps {
  geoblockStatus: GeoblockStatus | null;
}

// This banner is displayed when the user is geoblocked from trading
// It prevents trading initialization while still allowing users to view markets

export default function GeoBlockedBanner({
  geoblockStatus,
}: GeoBlockedBannerProps) {
  const { t } = useI18n();

  return (
    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-red-300 font-semibold text-lg mb-1">
            {t("geoblockedTitle")}
          </h3>
          <p className="text-red-200/80 text-sm mb-2">
            {t("geoblockedBody")}
          </p>
          {geoblockStatus && (
            <p className="text-red-200/60 text-xs">
              {t("detectedRegion")}: {geoblockStatus.country}
              {geoblockStatus.region ? `, ${geoblockStatus.region}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
