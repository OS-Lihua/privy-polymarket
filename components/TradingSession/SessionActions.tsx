import { SessionStep } from "@/utils/session";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface SessionActionsProps {
  isComplete: boolean | undefined;
  currentStep: SessionStep;
  onInitialize: () => void;
  onEnd: () => void;
}

export default function SessionActions({
  isComplete,
  currentStep,
  onInitialize,
  onEnd,
}: SessionActionsProps) {
  const { t } = useI18n();

  if (!isComplete) {
    return (
      <Button
        onClick={onInitialize}
        disabled={currentStep !== "idle"}
        loading={currentStep !== "idle"}
        className="flex-1"
      >
        {currentStep !== "idle" ? t("initializing") : t("initializeSession")}
      </Button>
    );
  }

  return (
    <>
      <div className="flex-1 rounded-md border border-success/25 bg-success/10 px-4 py-3 flex items-center justify-center">
        <span className="text-success font-medium">{t("sessionActive")}</span>
      </div>
      <Button
        onClick={onEnd}
        variant="destructive"
      >
        {t("endSession")}
      </Button>
    </>
  );
}
