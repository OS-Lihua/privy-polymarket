"use client";

import { useExportWallet, usePrivy } from "@privy-io/react-auth";
import {
	ArrowLeft,
	Copy,
	ExternalLink,
	KeyRound,
	LogOut,
	ShieldAlert,
	UserRound,
	Wallet,
} from "lucide-react";
import Link from "next/link";

import InfoTooltip from "@/components/shared/InfoTooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import { POLYMARKET_PROFILE_URL } from "@/constants/api";
import useAddressCopy from "@/hooks/useAddressCopy";
import { useI18n } from "@/lib/i18n";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import { cn } from "@/utils/classNames";
import { formatAddress } from "@/utils/formatting";

function AddressRow({
	label,
	help,
	address,
	copied,
	onCopy,
	copiedLabel,
	notReadyLabel,
	tone = "default",
}: {
	label: string;
	help: string;
	address: string | null;
	copied: boolean;
	onCopy: () => void;
	copiedLabel: string;
	notReadyLabel: string;
	tone?: "default" | "primary" | "success";
}) {
	const toneClass =
		tone === "primary"
			? "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
			: tone === "success"
				? "border-success/25 bg-success/10 text-success hover:bg-success/15"
				: "border-border bg-background text-foreground hover:bg-muted";

	return (
		<div className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium text-foreground">{label}</span>
				<InfoTooltip text={help} />
			</div>
			{address ? (
				<button
					type="button"
					onClick={onCopy}
					className={`inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 font-mono text-sm transition-colors sm:w-auto ${toneClass}`}
				>
					<Copy className="h-4 w-4" />
					{copied ? copiedLabel : formatAddress(address)}
				</button>
			) : (
				<div className="w-full rounded-md border border-warning/25 bg-warning/10 px-4 py-2 text-center text-sm font-medium text-warning sm:w-auto">
					{notReadyLabel}
				</div>
			)}
		</div>
	);
}

export default function AccountPage() {
	const { login, logout } = usePrivy();
	const { exportWallet } = useExportWallet();
	const { eoaAddress } = useWallet();
	const { depositWalletAddress, endTradingSession } = useTrading();
	const { t } = useI18n();
	const { copied: copiedEoa, copyAddress: copyEoaAddress } = useAddressCopy(
		eoaAddress || null,
	);
	const { copied: copiedDepositWallet, copyAddress: copyDepositWalletAddress } =
		useAddressCopy(depositWalletAddress || null);
	const polymarketAddress = depositWalletAddress || eoaAddress;
	const polymarketProfileUrl = polymarketAddress
		? POLYMARKET_PROFILE_URL(polymarketAddress)
		: null;

	const handleExportWallet = async () => {
		if (!eoaAddress) return;
		await exportWallet({ address: eoaAddress });
	};

	const handleDisconnect = async () => {
		endTradingSession();
		await logout();
	};

	if (!eoaAddress) {
		return (
			<div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
				<div className="mx-auto flex max-w-4xl flex-col gap-5">
					<Link
						href="/"
						className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
					>
						<ArrowLeft className="h-4 w-4" />
						{t("backToWorkbench")}
					</Link>
					<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
						<div className="flex max-w-2xl flex-col gap-4">
							<UserRound className="h-8 w-8 text-primary" />
							<div className="space-y-2">
								<h1 className="text-2xl font-semibold text-foreground">
									{t("accountNotConnectedTitle")}
								</h1>
								<p className="text-sm text-muted-foreground">
									{t("accountNotConnectedBody")}
								</p>
							</div>
							<Button onClick={login} className="w-fit">
								{t("login")}
							</Button>
						</div>
					</section>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
			<div className="mx-auto flex max-w-5xl flex-col gap-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Link
						href="/"
						className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
					>
						<ArrowLeft className="h-4 w-4" />
						{t("backToWorkbench")}
					</Link>
					<Button
						onClick={handleDisconnect}
						variant="destructive"
						className="w-full sm:w-auto"
					>
						<LogOut className="h-4 w-4" />
						{t("logout")}
					</Button>
				</div>

				<header className="rounded-lg border border-border bg-card p-6 shadow-sm">
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-3">
							<UserRound className="h-7 w-7 text-primary" />
							<p className="text-sm font-medium text-muted-foreground">
								{t("account")}
							</p>
						</div>
						<div className="space-y-2">
							<h1 className="text-2xl font-semibold tracking-tight text-foreground">
								{t("accountTitle")}
							</h1>
							<p className="max-w-3xl text-sm text-muted-foreground">
								{t("accountSubtitle")}
							</p>
						</div>
					</div>
				</header>

				<section className="rounded-lg border border-border bg-card p-6 shadow-sm">
					<div className="mb-2 flex items-center gap-2">
						<Wallet className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-semibold text-foreground">
							{t("walletOverview")}
						</h2>
					</div>
					<AddressRow
						label={t("eoaWallet")}
						help={t("eoaHelp")}
						address={eoaAddress}
						copied={copiedEoa}
						onCopy={copyEoaAddress}
						copiedLabel={t("copied")}
						notReadyLabel={t("notInitialized")}
					/>
					<AddressRow
						label={t("depositWallet")}
						help={t("depositWalletHelp")}
						address={depositWalletAddress || null}
						copied={copiedDepositWallet}
						onCopy={copyDepositWalletAddress}
						copiedLabel={t("copied")}
						notReadyLabel={t("depositWalletPending")}
						tone="success"
					/>
				</section>

				<section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
					<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
						<div className="flex h-full flex-col gap-4">
							<div className="flex items-start gap-3">
								<ExternalLink className="mt-0.5 h-5 w-5 text-primary" />
								<div className="space-y-1">
									<h2 className="text-lg font-semibold text-foreground">
										{t("profile")}
									</h2>
									<p className="text-sm text-muted-foreground">
										{t("polymarketProfileBody")}
									</p>
								</div>
							</div>
							<a
								href={polymarketProfileUrl || undefined}
								target="_blank"
								rel="noreferrer"
								className={cn(
									buttonVariants({ variant: "outline" }),
									"mt-auto w-full sm:w-fit",
								)}
							>
								<ExternalLink className="h-4 w-4" />
								{t("openPolymarketProfile")}
							</a>
						</div>
					</div>

					<div className="rounded-lg border border-destructive/25 bg-card p-6 shadow-sm">
						<div className="flex h-full flex-col gap-4">
							<div className="flex items-start gap-3">
								<ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
								<div className="space-y-1">
									<h2 className="text-lg font-semibold text-foreground">
										{t("privateKeyExportTitle")}
									</h2>
									<p className="text-sm text-muted-foreground">
										{t("privateKeyExportBody")}
									</p>
								</div>
							</div>
							<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
								{t("privateKeyExportWarning")}
							</div>
							<Button
								onClick={handleExportWallet}
								variant="destructive"
								className="mt-auto w-full sm:w-fit"
							>
								<KeyRound className="h-4 w-4" />
								{t("exportPrivateKey")}
							</Button>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
