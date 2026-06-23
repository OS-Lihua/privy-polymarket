type LogContext = Record<string, unknown>;
type LogLevel = "debug" | "info" | "warn" | "error";

let accessTokenGetter: (() => Promise<string | null>) | null = null;

export function setClientLogAccessTokenGetter(
	getter: (() => Promise<string | null>) | null,
) {
	accessTokenGetter = getter;
}

export const logger = {
	debug: (context: LogContext) => writeClientLog("debug", context),
	info: (context: LogContext) => writeClientLog("info", context),
	warn: (context: LogContext) => writeClientLog("warn", context),
	error: (context: LogContext) => writeClientLog("error", context),
};

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

function writeClientLog(level: LogLevel, context: LogContext) {
	const payload = sanitizeForClientLog({
		level,
		timestamp: new Date().toISOString(),
		...context,
	});

	if (typeof window === "undefined" || !accessTokenGetter) return;

	void accessTokenGetter()
		.then((token) => {
			if (!token) return;

			const body = JSON.stringify(payload);
			void fetch("/api/logs/client", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body,
				keepalive: true,
			}).catch(() => undefined);
		})
		.catch(() => undefined);
}

function sanitizeForClientLog(value: unknown): unknown {
	if (typeof value === "string") return sanitizeString(value);
	if (!value || typeof value !== "object") return value;
	if (Array.isArray(value)) return value.slice(0, 20).map(sanitizeForClientLog);

	const output: Record<string, unknown> = {};
	for (const [key, nestedValue] of Object.entries(value)) {
		if (isSensitiveKey(key)) {
			output[key] = "[redacted]";
			continue;
		}

		output[key] = sanitizeForClientLog(nestedValue);
	}

	return output;
}

function sanitizeString(value: string) {
	return value.replace(
		/0x[a-fA-F0-9]{40}/g,
		(address) => `${address.slice(0, 6)}...${address.slice(-4)}`,
	);
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

function readObjectFields(value: Error) {
	const fields: Record<string, unknown> = {};

	for (const key of Object.keys(value)) {
		fields[key] = (value as unknown as Record<string, unknown>)[key];
	}

	return fields;
}
