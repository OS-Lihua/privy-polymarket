import type { TradeAttempt } from "@prisma/client";
import { TERMINAL_ATTEMPT_STATUSES } from "@/lib/server/config";

export function isTerminalStatus(status: string) {
  return (TERMINAL_ATTEMPT_STATUSES as readonly string[]).includes(status);
}

export function canCancelAttempt(attempt: TradeAttempt) {
  return [
    "created",
    "fee_pending",
    "fee_submitted",
    "fee_verified",
    "order_pending",
  ].includes(attempt.status);
}

export function requiresRefundOnCancel(attempt: TradeAttempt) {
  return ["fee_submitted", "fee_verified", "order_pending"].includes(
    attempt.status
  );
}

export function classifyClientOrderResult(body: {
  response?: unknown;
  error?: unknown;
  status?: unknown;
}) {
  const status = typeof body.status === "string" ? body.status : undefined;
  const response = body.response as Record<string, unknown> | undefined;
  const orderId = readOrderId(response);

  if (orderId || status === "filled" || status === "success") {
    return {
      status: "order_filled",
      polymarketOrderId: orderId,
      feeRetainedAt: new Date(),
    };
  }

  if (body.error) {
    const errorMessage = readClientErrorMessage(body.error);

    if (isRefundableOrderFailure(errorMessage)) {
      return {
        status: "order_failed_refund_pending",
        errorMessage,
      };
    }

    return {
      status: "order_unknown_review",
      errorMessage:
        errorMessage || "Client reported an order error; requires manual review",
    };
  }

  return {
    status: "order_unknown_review",
    errorMessage: "Client submitted an unclear order result",
  };
}

function isRefundableOrderFailure(message: string | undefined) {
  if (!message) return false;

  const normalized = message.toLowerCase();
  return (
    normalized.includes("maker address not allowed") ||
    normalized.includes("not enough balance / allowance") ||
    normalized.includes("allowance is not enough") ||
    normalized.includes("please use the deposit wallet flow")
  );
}

function readClientErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  const record = error as Record<string, unknown>;
  if (typeof record.message === "string" && record.message) {
    const response = record.response as Record<string, unknown> | undefined;
    if (response && typeof response.error === "string" && response.error) {
      return response.error;
    }

    return record.message;
  }

  return undefined;
}

function readOrderId(response: Record<string, unknown> | undefined) {
  if (!response) return undefined;

  const orderId = response.orderID || response.orderId || response.id;
  return typeof orderId === "string" ? orderId : undefined;
}
