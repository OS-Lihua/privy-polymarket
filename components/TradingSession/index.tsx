"use client";

import { useWallet } from "@/providers/WalletContext";

import SessionInfo from "@/components/TradingSession/SessionInfo";
import SessionStatus from "@/components/TradingSession/SessionStatus";
import SessionSuccess from "@/components/TradingSession/SessionSuccess";
import SessionActions from "@/components/TradingSession/SessionActions";
import SessionProgress from "@/components/TradingSession/SessionProgress";
import { useI18n } from "@/lib/i18n";

import type {
	TradingSession as TradingSessionType,
	SessionStep,
} from "@/utils/session";

interface Props {
	session: TradingSessionType | null;
	currentStep: SessionStep;
	error: Error | null;
	isComplete: boolean | undefined;
	initialize: () => Promise<void>;
	endSession: () => void;
}

export default function TradingSession({
	session,
	currentStep,
	error,
	isComplete,
	initialize,
	endSession,
}: Props) {
	const { eoaAddress } = useWallet();
	const { t } = useI18n();

	if (!eoaAddress) {
		return null;
	}

	return (
		<div
			className="rounded-lg border border-border bg-card p-5 shadow-sm"
			data-tour="session"
		>
			<SessionStatus isComplete={isComplete} />
			<SessionInfo isComplete={isComplete} />
			<SessionProgress currentStep={currentStep} />
			{isComplete && session && <SessionSuccess session={session} />}

			{error && (
				<div className="mb-4 rounded-lg border border-destructive/25 bg-destructive/10 p-4">
					<p className="text-sm text-destructive font-medium mb-2">
						{t("error")}
					</p>
					<pre className="text-xs text-destructive whitespace-pre-wrap">
						{error.message}
					</pre>
				</div>
			)}

			<div className="flex gap-3">
				<SessionActions
					isComplete={isComplete}
					currentStep={currentStep}
					onInitialize={initialize}
					onEnd={endSession}
				/>
			</div>
		</div>
	);
}
