import { useI18n } from "@/lib/i18n";

export default function SessionInfo({
	isComplete,
}: {
	isComplete: boolean | undefined;
}) {
	const { t } = useI18n();

	if (isComplete) return null;

	return (
		<div className="text-sm text-gray-300 bg-blue-500/10 border border-blue-500/20 rounded p-4 mb-4">
			<p className="font-medium mb-2">{t("sessionQuestion")}</p>
			<p className="text-xs leading-relaxed text-gray-400 mb-3">
				{t("sessionIntro")}
			</p>
			<ul className="text-xs leading-relaxed text-gray-400 space-y-1 ml-4 list-disc">
				<li>{t("sessionDeploy")}</li>
				<li>{t("sessionCredentials")}</li>
				<li>{t("sessionApprovals")}</li>
			</ul>
		</div>
	);
}
