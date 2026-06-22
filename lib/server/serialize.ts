export function serializeAttempt<T>(attempt: T): T {
  return JSON.parse(
    JSON.stringify(attempt, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}
