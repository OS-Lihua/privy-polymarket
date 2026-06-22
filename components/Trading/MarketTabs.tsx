"use client";

import { useState } from "react";

import Card from "@/components/shared/Card";
import ActiveOrders from "@/components/Trading/Orders";
import UserPositions from "@/components/Trading/Positions";
import HighVolumeMarkets from "@/components/Trading/Markets";

import { cn } from "@/utils/classNames";
import { useI18n } from "@/lib/i18n";

type TabId = "positions" | "orders" | "markets";

const tabs: TabId[] = ["positions", "orders", "markets"];

export default function MarketTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("markets");
  const { t } = useI18n();

  const labels: Record<TabId, string> = {
    positions: t("positions"),
    orders: t("orders"),
    markets: t("markets"),
  };

  return (
    <Card className="p-6" data-tour="order">
      {/* Tab Navigation */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-1 flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            )}
          >
            {labels[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "positions" && <UserPositions />}
        {activeTab === "orders" && <ActiveOrders />}
        {activeTab === "markets" && <HighVolumeMarkets />}
      </div>
    </Card>
  );
}
