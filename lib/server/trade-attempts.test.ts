import { describe, expect, it } from "vitest";
import {
	canCancelAttempt,
	classifyClientOrderResult,
	isTerminalStatus,
	requiresRefundOnCancel,
} from "@/lib/server/trade-attempts";
import {
	BLOCKING_ATTEMPT_STATUSES,
	TERMINAL_ATTEMPT_STATUSES,
} from "@/lib/server/config";

describe("trade attempt state helpers", () => {
	it("allows cancellation until an order is filled", () => {
		expect(canCancelAttempt({ status: "created" } as any)).toBe(true);
		expect(canCancelAttempt({ status: "fee_pending" } as any)).toBe(true);
		expect(canCancelAttempt({ status: "fee_submitted" } as any)).toBe(true);
		expect(canCancelAttempt({ status: "fee_verified" } as any)).toBe(true);
		expect(canCancelAttempt({ status: "order_pending" } as any)).toBe(true);
		expect(canCancelAttempt({ status: "order_filled" } as any)).toBe(false);
	});

	it("requires refund when cancelling after fee submission", () => {
		expect(requiresRefundOnCancel({ status: "created" } as any)).toBe(false);
		expect(requiresRefundOnCancel({ status: "fee_pending" } as any)).toBe(
			false,
		);
		expect(requiresRefundOnCancel({ status: "fee_submitted" } as any)).toBe(
			true,
		);
		expect(requiresRefundOnCancel({ status: "fee_verified" } as any)).toBe(
			true,
		);
		expect(requiresRefundOnCancel({ status: "order_pending" } as any)).toBe(
			true,
		);
	});

	it("treats order ids as filled", () => {
		expect(
			classifyClientOrderResult({ response: { orderID: "0xabc" } }),
		).toMatchObject({
			status: "order_filled",
			polymarketOrderId: "0xabc",
		});
	});

	it("sends client-only failures to manual review", () => {
		expect(
			classifyClientOrderResult({ error: { message: "execution failed" } }),
		).toMatchObject({
			status: "order_unknown_review",
		});
	});

	it("extracts nested CLOB error messages", () => {
		expect(
			classifyClientOrderResult({
				error: {
					message: "Order submission failed",
					response: {
						error: "invalid order version, please use the latest clob-client",
						status: 400,
					},
				},
			}),
		).toMatchObject({
			status: "order_unknown_review",
			errorMessage: "invalid order version, please use the latest clob-client",
		});
	});

	it("marks deposit-wallet flow rejections for refund", () => {
		expect(
			classifyClientOrderResult({
				error: {
					message: "Order submission failed",
					response: {
						error:
							"maker address not allowed, please use the deposit wallet flow",
						status: 400,
					},
				},
			}),
		).toMatchObject({
			status: "order_failed_refund_pending",
			errorMessage:
				"maker address not allowed, please use the deposit wallet flow",
		});
	});

	it("does not block new orders while a previous fee is waiting for refund", () => {
		expect(BLOCKING_ATTEMPT_STATUSES).not.toContain(
			"order_failed_refund_pending" as any,
		);
		expect(BLOCKING_ATTEMPT_STATUSES).not.toContain("refund_pending" as any);
		expect(BLOCKING_ATTEMPT_STATUSES).not.toContain(
			"refund_pending_review" as any,
		);
		expect(BLOCKING_ATTEMPT_STATUSES).not.toContain(
			"refund_too_small_review" as any,
		);
	});

	it("keeps manual refund review statuses visible to admins", () => {
		expect(TERMINAL_ATTEMPT_STATUSES).not.toContain(
			"refund_pending_review" as any,
		);
		expect(TERMINAL_ATTEMPT_STATUSES).not.toContain(
			"refund_too_small_review" as any,
		);
		expect(isTerminalStatus("refund_pending_review")).toBe(false);
	});
});
