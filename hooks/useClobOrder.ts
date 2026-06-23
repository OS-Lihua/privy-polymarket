import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Side, OrderType } from "@polymarket/clob-client-v2";
import { logger, serializeError } from "@/lib/logger";
import type {
	ClobClient,
	OrderResponse,
	TickSize,
	UserOrderV2,
	UserMarketOrderV2,
} from "@polymarket/clob-client-v2";

export type OrderParams = {
	tokenId: string;
	size: number;
	amount?: number;
	price?: number;
	side: "BUY" | "SELL";
	negRisk?: boolean;
	tickSize?: TickSize;
	isMarketOrder?: boolean;
	traceId?: string;
	attemptId?: string;
};

export class ClobOrderError extends Error {
	response: unknown;

	constructor(message: string, response: unknown) {
		super(message);
		this.name = "ClobOrderError";
		this.response = response;
	}
}

export default function useClobOrder(
	clobClient: ClobClient | null,
	walletAddress: string | undefined,
) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [orderId, setOrderId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const submitOrder = useCallback(
		async (params: OrderParams) => {
			if (!walletAddress) {
				throw new Error("Wallet not connected");
			}
			if (!clobClient) {
				throw new Error("CLOB client not initialized");
			}

			setIsSubmitting(true);
			setError(null);
			setOrderId(null);

			try {
				const side = params.side === "BUY" ? Side.BUY : Side.SELL;
				let response: Partial<OrderResponse> | undefined;

				logger.info({
					event: "clob_order_submit_started",
					traceId: params.traceId,
					attemptId: params.attemptId,
					tokenId: params.tokenId,
					side: params.side,
					isMarketOrder: params.isMarketOrder,
					amount: params.amount,
					size: params.size,
					price: params.price,
					negRisk: params.negRisk,
					tickSize: params.tickSize,
				});

				if (params.isMarketOrder) {
					// For market orders, use createAndPostMarketOrder with FOK
					// BUY orders need amount in dollars (size * askPrice)
					// SELL orders need amount in shares
					let marketAmount: number;

					if (side === Side.BUY && params.amount && params.price) {
						marketAmount = params.amount;
					} else if (side === Side.BUY) {
						// Get the ask price (price to buy at)
						const priceResponse = await clobClient.getPrice(
							params.tokenId,
							Side.SELL, // Get sell side price = ask price for buyers
						);
						const askPrice = parseFloat(priceResponse.price);

						if (isNaN(askPrice) || askPrice <= 0 || askPrice >= 1) {
							throw new Error("Unable to get valid market price");
						}

						// Convert shares to dollar amount for BUY orders
						marketAmount = params.size * askPrice;
					} else {
						// For SELL orders, amount is in shares
						marketAmount = params.size;
					}

					const marketOrder: UserMarketOrderV2 = {
						tokenID: params.tokenId,
						amount: marketAmount,
						side,
						price: params.price,
						orderType: OrderType.FOK,
					};

					response = await clobClient.createAndPostMarketOrder(
						marketOrder,
						{ negRisk: params.negRisk, tickSize: params.tickSize },
						OrderType.FOK, // Fill or Kill for market orders
					);
				} else {
					// For limit orders, use createAndPostOrder with GTC
					if (!params.price) {
						throw new Error("Price required for limit orders");
					}

					const limitOrder: UserOrderV2 = {
						tokenID: params.tokenId,
						price: params.price,
						size: params.size,
						side,
						expiration: 0,
					};

					response = await clobClient.createAndPostOrder(
						limitOrder,
						{ negRisk: params.negRisk },
						OrderType.GTC, // Good Till Cancelled for limit orders
					);
				}

				if (response?.orderID) {
					logger.info({
						event: "clob_order_submit_succeeded",
						traceId: params.traceId,
						attemptId: params.attemptId,
						orderID: response.orderID,
						status: response.status,
					});
					setOrderId(response.orderID);
					queryClient.invalidateQueries({ queryKey: ["active-orders"] });
					queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
					return { success: true, orderId: response.orderID };
				}

				logger.warn({
					event: "clob_order_submit_rejected",
					traceId: params.traceId,
					attemptId: params.attemptId,
					response,
				});
				throw new ClobOrderError(
					readOrderFailureMessage(response),
					response ?? null,
				);
			} catch (err: unknown) {
				const error =
					err instanceof Error ? err : new Error("Failed to submit order");
				logger.warn({
					event: "clob_order_submit_failed",
					traceId: params.traceId,
					attemptId: params.attemptId,
					error: serializeError(error),
				});
				setError(error);
				throw error;
			} finally {
				setIsSubmitting(false);
			}
		},
		[clobClient, walletAddress, queryClient],
	);

	const cancelOrder = useCallback(
		async (orderId: string) => {
			if (!clobClient) {
				throw new Error("CLOB client not initialized");
			}

			setIsSubmitting(true);
			setError(null);

			try {
				await clobClient.cancelOrder({ orderID: orderId });
				queryClient.invalidateQueries({ queryKey: ["active-orders"] });
				return { success: true };
			} catch (err: unknown) {
				const error =
					err instanceof Error ? err : new Error("Failed to cancel order");
				setError(error);
				throw error;
			} finally {
				setIsSubmitting(false);
			}
		},
		[clobClient, queryClient],
	);

	return {
		submitOrder,
		cancelOrder,
		isSubmitting,
		error,
		orderId,
	};
}

function readOrderFailureMessage(response: Partial<OrderResponse> | undefined) {
	if (
		typeof (response as { error?: unknown } | undefined)?.error === "string"
	) {
		return (response as { error: string }).error;
	}

	if (typeof response?.errorMsg === "string" && response.errorMsg) {
		return response.errorMsg;
	}

	if (typeof response?.status === "string" && response.status) {
		return `Order submission failed: ${response.status}`;
	}

	return "Order submission failed";
}
