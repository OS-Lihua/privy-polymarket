import Card from "@/components/shared/Card";
import ActiveOrders from "@/components/Trading/Orders";
import UserPositions from "@/components/Trading/Positions";
import HighVolumeMarkets from "@/components/Trading/Markets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useI18n } from "@/lib/i18n";

type TabId = "positions" | "orders" | "markets";

const tabs: TabId[] = ["positions", "orders", "markets"];

export default function MarketTabs() {
	const { t } = useI18n();

	const labels: Record<TabId, string> = {
		positions: t("positions"),
		orders: t("orders"),
		markets: t("markets"),
	};

	return (
		<Card className="p-5" data-tour="order">
			<Tabs defaultValue="markets">
				<div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-lg font-semibold tracking-tight">
							Trading workspace
						</h2>
						<p className="text-sm text-muted-foreground">
							Markets, live orders, and positions share the same trading
							session.
						</p>
					</div>
					<TabsList className="grid w-full grid-cols-3 sm:w-auto">
						{tabs.map((tab) => (
							<TabsTrigger key={tab} value={tab}>
								{labels[tab]}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				<TabsContent value="markets">
					<HighVolumeMarkets />
				</TabsContent>
				<TabsContent value="orders">
					<ActiveOrders />
				</TabsContent>
				<TabsContent value="positions">
					<UserPositions />
				</TabsContent>
			</Tabs>
		</Card>
	);
}
