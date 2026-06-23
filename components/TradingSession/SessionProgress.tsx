import { SessionStep } from "@/utils/session";
import { useI18n } from "@/lib/i18n";

export default function SessionProgress({
  currentStep,
}: {
  currentStep: SessionStep;
}) {
  const { t } = useI18n();

  if (currentStep === "idle" || currentStep === "complete") return null;

  return (
    <div className="bg-purple-500/10 border border-purple-500/20 rounded p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400" />
        <p className="text-sm font-medium text-purple-300">
          {currentStep === "checking" && `${t("checkingSession")}...`}
          {currentStep === "depositWallet" && `${t("settingUpDepositWallet")}...`}
          {currentStep === "credentials" && `${t("gettingCredentials")}...`}
          {currentStep === "approvals" && `${t("settingApprovals")}...`}
        </p>
      </div>
    </div>
  );
}
