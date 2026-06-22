export type FeeBreakdown = {
  totalAmountUsdcMicros: bigint;
  feeAmountUsdcMicros: bigint;
  orderAmountUsdcMicros: bigint;
};

export function parseUsdcMicros(input: unknown): bigint {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("totalAmountUsdc is required");
  }

  const value = input.trim();
  if (!/^\d+(\.\d{0,6})?$/.test(value)) {
    throw new Error("totalAmountUsdc must have at most 6 decimal places");
  }

  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

export function calculateFeeBreakdown(
  totalAmountUsdcMicros: bigint,
  feeBps: number
): FeeBreakdown {
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new Error("feeBps must be between 0 and 10000");
  }

  const feeAmountUsdcMicros =
    (totalAmountUsdcMicros * BigInt(feeBps)) / 10_000n;

  return {
    totalAmountUsdcMicros,
    feeAmountUsdcMicros,
    orderAmountUsdcMicros: totalAmountUsdcMicros - feeAmountUsdcMicros,
  };
}

export function usdcMicrosToDecimalString(value: bigint): string {
  const whole = value / 1_000_000n;
  const fraction = value % 1_000_000n;
  const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}
