import { cn } from "@/utils/classNames";
import { useI18n } from "@/lib/i18n";

export default function SessionStatus({
  isComplete,
}: {
  isComplete: boolean | undefined;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold">{t("tradingSession")}</h3>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isComplete ? "bg-success" : "bg-muted-foreground"
          )}
        />
        <span className="text-sm text-muted-foreground">
          {isComplete ? t("readyToTrade") : t("notInitialized")}
        </span>
      </div>
    </div>
  );
}
