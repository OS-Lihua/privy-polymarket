import { dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import pino from "pino";
import { createTraceId, serializeError } from "@/lib/logger";

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

const logFilePath = process.env.SERVER_LOG_FILE_PATH || "logs/server.log";

ensureLogDirectory(logFilePath);

export const logger = pino(
  {
    name: "privy-polymarket",
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: REDACT_PATHS,
      censor: "[redacted]",
    },
  },
  pino.destination({ dest: logFilePath, sync: false })
);

export function getTraceId(headers: Headers) {
  return headers.get("x-trace-id") || createTraceId();
}

export function logError(error: unknown, context: LogContext = {}) {
  logger.error({ ...context, error: serializeError(error) });
}

export function safeErrorResponse(message: string, traceId?: string) {
  return traceId ? { error: message, traceId } : { error: message };
}

function ensureLogDirectory(path: string) {
  const directory = dirname(path);
  if (!directory || directory === "." || existsSync(directory)) return;
  mkdirSync(directory, { recursive: true });
}
