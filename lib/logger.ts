import pino from "pino";

type LogContext = Record<string, unknown>;

const REDACT_PATHS = [
  "authorization",
  "Authorization",
  "headers.Authorization",
  "headers.authorization",
  "POLY_SIGNATURE",
  "POLY_API_KEY",
  "POLY_PASSPHRASE",
  "POLY_BUILDER_SIGNATURE",
  "POLY_BUILDER_API_KEY",
  "POLY_BUILDER_PASSPHRASE",
  "*.signature",
  "*.secret",
  "*.passphrase",
  "*.apiKey",
  "*.key",
];

export const logger = pino({
  name: "privy-polymarket",
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || "info",
  redact: {
    paths: REDACT_PATHS,
    censor: "[redacted]",
  },
  browser: {
    asObject: false,
  },
});

export function createTraceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `trace_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getTraceId(headers: Headers) {
  return headers.get("x-trace-id") || createTraceId();
}

export function logError(error: unknown, context: LogContext = {}) {
  logger.error({ ...context, error: serializeError(error) });
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...readObjectFields(error),
    };
  }

  return error;
}

function readObjectFields(value: Error) {
  const fields: Record<string, unknown> = {};

  for (const key of Object.keys(value)) {
    fields[key] = (value as unknown as Record<string, unknown>)[key];
  }

  return fields;
}
