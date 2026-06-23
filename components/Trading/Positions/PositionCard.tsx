import Image from "next/image";
import type { PolymarketPosition } from "@/hooks/useUserPositions";

import Card from "@/components/shared/Card";
import StatDisplay from "@/components/shared/StatDisplay";
import { Button } from "@/components/ui/button";

import {
	formatCurrency,
	formatShares,
	formatPercentage,
} from "@/utils/formatting";

interface PositionCardProps {
	position: PolymarketPosition;
	onSell: (position: PolymarketPosition) => void;
	onRedeem: (position: PolymarketPosition) => void;
	isSelling: boolean;
	isRedeeming: boolean;
	isPendingVerification: boolean;
	isSubmitting: boolean;
	canSell: boolean;
	canRedeem: boolean;
}

export default function PositionCard({
	position,
	onSell,
	onRedeem,
	isSelling,
	isRedeeming,
	isPendingVerification,
	isSubmitting,
	canSell,
	canRedeem,
}: PositionCardProps) {
	return (
		<Card className="p-4 space-y-3">
			{/* Market Title and Icon */}
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="font-semibold text-lg">{position.title}</h3>
					<p className="text-sm text-muted-foreground mt-1">
						Outcome: <span className="text-foreground">{position.outcome}</span>
					</p>
				</div>
				{position.icon && (
					<Image
						src={position.icon}
						alt=""
						width={48}
						height={48}
						unoptimized
						className="w-12 h-12 rounded-md object-cover ring-1 ring-border"
					/>
				)}
			</div>

			{/* Position Stats Grid */}
			<div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-3">
				<StatDisplay
					label="Size"
					value={`${formatShares(position.size)} shares`}
				/>
				<StatDisplay
					label="Avg Price"
					value={formatCurrency(position.avgPrice, 3)}
				/>
				<StatDisplay
					label="Current Price"
					value={formatCurrency(position.curPrice, 3)}
				/>
				<StatDisplay
					label="Current Value"
					value={formatCurrency(position.currentValue)}
				/>
				<StatDisplay
					label="Initial Value"
					value={formatCurrency(position.initialValue)}
				/>
				<StatDisplay
					label="P&L"
					value={`${formatCurrency(position.cashPnl)} (${formatPercentage(position.percentPnl)})`}
					highlight={true}
					highlightColor={position.cashPnl >= 0 ? "green" : "red"}
				/>
			</div>

			{/* Redeemable Event Banner */}
			{position.redeemable && (
				<div className="bg-primary/10 border border-primary/25 rounded-lg p-3">
					<p className="text-primary text-sm font-medium">
						Event Completed - Position Redeemable
					</p>
				</div>
			)}

			{/* Action Button - Redeem or Market Sell */}
			{position.redeemable ? (
				<>
					<Button
						onClick={() => onRedeem(position)}
						disabled={isRedeeming || !canRedeem}
						variant="default"
						loading={isRedeeming}
						className="w-full"
					>
						{isRedeeming ? "Redeeming..." : "Redeem Position"}
					</Button>
					{!canRedeem && (
						<p className="text-xs text-warning text-center -mt-2">
							Initialize trading session first
						</p>
					)}
				</>
			) : (
				<>
					<Button
						onClick={() => onSell(position)}
						disabled={
							isSelling || isSubmitting || !canSell || isPendingVerification
						}
						variant="destructive"
						loading={isSelling || isPendingVerification}
						className="w-full"
					>
						{isSelling || isPendingVerification
							? "Processing..."
							: "Market Sell"}
					</Button>
					{!canSell && (
						<p className="text-xs text-warning text-center -mt-2">
							Initialize CLOB client first
						</p>
					)}
				</>
			)}
		</Card>
	);
}
