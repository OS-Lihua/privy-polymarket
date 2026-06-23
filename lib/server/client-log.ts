import { dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import pino from "pino";

const clientLogFilePath =
  process.env.CLIENT_LOG_FILE_PATH || "logs/client.log";

ensureLogDirectory(clientLogFilePath);

export const clientLogger = pino(
  {
    name: "privy-polymarket-client",
    level: process.env.CLIENT_LOG_LEVEL || process.env.LOG_LEVEL || "info",
  },
  pino.destination({ dest: clientLogFilePath, sync: false })
);

export function sanitizeClientLogPayload(input: unknown) {
  const sanitized = sanitizeValue(input, 0);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return {};
  }

  return sanitized as Record<string, unknown>;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (!value || typeof value !== "object") return undefined;

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }

  const output: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      output[key] = "[redacted]";
      continue;
    }

    output[key] = sanitizeValue(nestedValue, depth + 1);
  }

  return output;
}

function sanitizeString(value: string) {
  const shortened = value
    .slice(0, 4_000)
    .replace(/0x[a-fA-F0-9]{40}/g, (address) =>
      `${address.slice(0, 6)}...${address.slice(-4)}`
    );

  return shortened;
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === "token" ||
    normalized === "accesstoken" ||
    normalized === "authtoken" ||
    normalized.includes("secret") ||
    normalized.includes("passphrase") ||
    normalized.includes("privatekey") ||
    normalized.includes("authorization") ||
    normalized.includes("signature") ||
    normalized.includes("apikey") ||
    normalized.includes("api_key") ||
    normalized === "key" ||
    normalized.includes("buildercreds")
  );
}

function ensureLogDirectory(path: string) {
  const directory = dirname(path);
  if (!directory || directory === "." || existsSync(directory)) return;
  mkdirSync(directory, { recursive: true });
}
