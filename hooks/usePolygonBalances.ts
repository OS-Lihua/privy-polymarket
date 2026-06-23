import { erc20Abi, formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/providers/WalletContext";
import {
	PUSD_CONTRACT_ADDRESS,
	PUSD_DECIMALS,
	USDC_E_CONTRACT_ADDRESS,
	USDC_E_DECIMALS,
} from "@/constants/tokens";
import { QUERY_STALE_TIMES, QUERY_REFETCH_INTERVALS } from "@/constants/query";

export default function usePolygonBalances(address: string | undefined) {
	const { publicClient } = useWallet();

	const {
		data: balances,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["polygon-balances", address],
		queryFn: async () => {
			if (!address || !publicClient) return null;

			const [pusdBalance, usdcBalance] = await Promise.all([
				publicClient.readContract({
					address: PUSD_CONTRACT_ADDRESS,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [address as `0x${string}`],
				}),
				publicClient.readContract({
					address: USDC_E_CONTRACT_ADDRESS,
					abi: erc20Abi,
					functionName: "balanceOf",
					args: [address as `0x${string}`],
				}),
			]);

			return { pusdBalance, usdcBalance };
		},
		enabled: !!address,
		staleTime: QUERY_STALE_TIMES.BALANCE,
		refetchInterval: QUERY_REFETCH_INTERVALS.BALANCE,
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: true,
	});

	const pusdBalance = balances?.pusdBalance ?? null;
	const usdcBalance = balances?.usdcBalance ?? null;
	const formattedPusdBalance = pusdBalance
		? parseFloat(formatUnits(pusdBalance, PUSD_DECIMALS))
		: 0;
	const formattedUsdcBalance = usdcBalance
		? parseFloat(formatUnits(usdcBalance, USDC_E_DECIMALS))
		: 0;

	return {
		pusdBalance: formattedPusdBalance,
		formattedPusdBalance: formattedPusdBalance.toFixed(2),
		rawPusdBalance: pusdBalance,
		usdcBalance: formattedUsdcBalance,
		formattedUsdcBalance: formattedUsdcBalance.toFixed(2),
		rawUsdcBalance: usdcBalance,
		isLoading,
		isError: !!error,
		error,
	};
}
