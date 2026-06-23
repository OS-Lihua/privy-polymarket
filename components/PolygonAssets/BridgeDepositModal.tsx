"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, X } from "lucide-react";
import Portal from "@/components/Portal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getBridgeAddressType,
	useBridgeDepositAddresses,
	useBridgeSupportedAssets,
} from "@/hooks/useBridgeDeposit";
import { formatAddress } from "@/utils/formatting";
import { cn } from "@/utils/classNames";

type BridgeDepositModalProps = {
	isOpen: boolean;
	onClose: () => void;
	depositWalletAddress: string;
};

export default function BridgeDepositModal({
	isOpen,
	onClose,
	depositWalletAddress,
}: BridgeDepositModalProps) {
	const [selectedChain, setSelectedChain] = useState("");
	const [selectedToken, setSelectedToken] = useState("");
	const [copied, setCopied] = useState(false);

	const {
		data: assets = [],
		isLoading: isLoadingAssets,
		error: assetsError,
	} = useBridgeSupportedAssets();
	const {
		data: depositData,
		isLoading: isLoadingAddress,
		error: addressError,
	} = useBridgeDepositAddresses(isOpen ? depositWalletAddress : undefined);

	const chainNames = useMemo(() => {
		const names = assets.map((asset) => asset.chainName).filter(isString);
		return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
	}, [assets]);

	const tokenSymbols = useMemo(() => {
		const names = assets
			.filter((asset) => asset.chainName === selectedChain)
			.map((asset) => asset.token?.symbol)
			.filter(isString);
		return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
	}, [assets, selectedChain]);

	const filteredAssets = useMemo(
		() =>
			assets.filter((asset) => {
				if (selectedChain && asset.chainName !== selectedChain) return false;
				if (selectedToken && asset.token?.symbol !== selectedToken) return false;
				return true;
			}),
		[assets, selectedChain, selectedToken],
	);

	const selectedAsset = filteredAssets[0] || assets[0];
	const addressType = getBridgeAddressType(selectedAsset?.chainName);
	const bridgeAddress = depositData?.address?.[addressType];

	useEffect(() => {
		if (!isOpen) return;
		setCopied(false);
	}, [isOpen]);

	useEffect(() => {
		if (!chainNames.length) return;
		if (!selectedChain || !chainNames.includes(selectedChain)) {
			setSelectedChain(preferredChain(chainNames));
		}
	}, [chainNames, selectedChain]);

	useEffect(() => {
		if (!tokenSymbols.length) {
			if (selectedToken) setSelectedToken("");
			return;
		}
		if (!selectedToken || !tokenSymbols.includes(selectedToken)) {
			setSelectedToken(preferredToken(tokenSymbols));
		}
	}, [selectedToken, tokenSymbols]);

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isOpen) onClose();
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const handleCopy = async () => {
		if (!bridgeAddress) return;
		await navigator.clipboard.writeText(bridgeAddress);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) onClose();
	};

	return (
		<Portal>
			<div
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
				onClick={handleBackdropClick}
			>
				<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
					<div className="mb-5 flex items-start justify-between gap-4">
						<div>
							<h3 className="text-xl font-semibold">Deposit with Bridge</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Send a supported asset to Polymarket Bridge. It converts to
								Polygon pUSD for this Deposit Wallet.
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
							aria-label="Close bridge deposit"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<SelectField
							label="Token"
							value={selectedToken}
							onChange={setSelectedToken}
							options={tokenSymbols}
							disabled={isLoadingAssets}
						/>
						<SelectField
							label="Chain"
							value={selectedChain}
							onChange={setSelectedChain}
							options={chainNames}
							disabled={isLoadingAssets}
						/>
					</div>

					<div className="mt-5 rounded-lg border border-border bg-panel p-4">
						<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
							<div>
								<p className="text-sm font-medium">Bridge deposit address</p>
								<p className="text-xs text-muted-foreground">
									Use this address only for the selected supported asset.
								</p>
							</div>
							{selectedAsset?.minCheckoutUsd != null && (
								<span className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground">
									Min ${selectedAsset.minCheckoutUsd}
								</span>
							)}
						</div>

						{isLoadingAssets || isLoadingAddress ? (
							<Skeleton className="h-24 w-full" />
						) : assetsError || addressError ? (
							<p className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
								Failed to load Polymarket Bridge details.
							</p>
						) : bridgeAddress ? (
							<div className="space-y-3">
								<div className="rounded-md border border-input bg-background p-3 font-mono text-sm break-all">
									{bridgeAddress}
								</div>
								<div className="flex flex-col gap-2 sm:flex-row">
									<Button
										type="button"
										onClick={handleCopy}
										variant="secondary"
										className="sm:flex-1"
									>
										<Copy className="h-4 w-4" />
										{copied ? "Copied" : "Copy address"}
									</Button>
									<a
										href="https://docs.polymarket.com/trading/bridge/deposit"
										target="_blank"
										rel="noreferrer"
										className={cn(
											buttonVariants({ variant: "outline" }),
											"sm:flex-1",
										)}
									>
										<ExternalLink className="h-4 w-4" />
										Bridge docs
									</a>
								</div>
							</div>
						) : (
							<p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
								No bridge address is available for this chain type.
							</p>
						)}
					</div>

					<div className="mt-4 grid gap-3 text-sm text-muted-foreground">
						<InfoRow label="Final credit" value="Polygon pUSD" />
						<InfoRow
							label="Deposit Wallet"
							value={formatAddress(depositWalletAddress)}
						/>
						<InfoRow
							label="Source gas"
							value="Paid by the sending wallet on the source chain"
						/>
					</div>
				</div>
			</div>
		</Portal>
	);
}

function SelectField({
	label,
	value,
	onChange,
	options,
	disabled,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	disabled?: boolean;
}) {
	return (
		<label className="block">
			<span className="mb-2 block text-sm font-medium">{label}</span>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				disabled={disabled}
				className={cn(
					"h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
				)}
			>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</label>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-md border border-border bg-panel px-3 py-2">
			<span>{label}</span>
			<span className="text-right font-medium text-foreground">{value}</span>
		</div>
	);
}

function isString(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}

function preferredChain(chains: string[]) {
	return (
		chains.find((chain) => chain === "Polygon") ||
		chains.find((chain) => chain === "Base") ||
		chains[0]
	);
}

function preferredToken(tokens: string[]) {
	return (
		tokens.find((token) => token === "USDC") ||
		tokens.find((token) => token === "USDT") ||
		tokens[0]
	);
}
