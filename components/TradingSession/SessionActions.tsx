import { SessionStep } from "@/utils/session";
import { useI18n } from "@/lib/i18n";

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
      <button
        onClick={onInitialize}
        disabled={currentStep !== "idle"}
        className="btn btn-primary flex-1 py-3"
      >
        {currentStep !== "idle"
          ? `${t("initializing")}...`
          : t("initializeSession")}
      </button>
    );
  }

  return (
    <>
      <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-md px-4 py-3 flex items-center justify-center">
        <span className="text-green-300 font-medium">{t("sessionActive")}</span>
      </div>
      <button
        onClick={onEnd}
        className="btn btn-danger py-3"
      >
        {t("endSession")}
      </button>
    </>
  );
}
