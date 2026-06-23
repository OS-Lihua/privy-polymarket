import { convertPriceToCents } from "@/utils/order";
import { cn } from "@/utils/classNames";

interface OutcomeButtonsProps {
  outcomes: string[];
  outcomePrices: number[];
  tokenIds: string[];
  isClosed: boolean;
  negRisk: boolean;
  marketQuestion: string;
  disabled?: boolean;
  onOutcomeClick: (
    marketTitle: string,
    outcome: string,
    price: number,
    tokenId: string,
    negRisk: boolean
  ) => void;
}

export default function OutcomeButtons({
  outcomes,
  outcomePrices,
  tokenIds,
  isClosed,
  negRisk,
  marketQuestion,
  disabled = false,
  onOutcomeClick,
}: OutcomeButtonsProps) {
  if (outcomes.length === 0) return null;

  const isDisabled = isClosed || disabled;

  return (
    <div className="flex gap-2 flex-wrap">
      {outcomes.map((outcome: string, idx: number) => {
        const tokenId = tokenIds[idx] || "";
        const price = outcomePrices[idx] || 0;
        const priceInCents = convertPriceToCents(price);
        const hasPrice = price > 0 && price < 1;

        return (
          <button
            key={`outcome-${idx}`}
            onClick={() => {
              if (!isDisabled && tokenId && hasPrice) {
                onOutcomeClick(
                  marketQuestion,
                  outcome,
                  price,
                  tokenId,
                  negRisk
                );
              }
            }}
            disabled={isDisabled || !tokenId || !hasPrice}
            className={cn(
              "flex-1 min-w-[120px] rounded-md border px-3 py-2 transition-colors duration-200",
              isDisabled || !tokenId || !hasPrice
                ? "bg-muted border-border cursor-not-allowed opacity-60"
                : "bg-background border-border hover:bg-primary/10 hover:border-primary/35 cursor-pointer"
            )}
          >
            <p className="text-xs text-muted-foreground mb-1 truncate">{outcome}</p>
            <p className="text-primary font-semibold text-lg">
              {hasPrice ? `${priceInCents}¢` : "--"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
