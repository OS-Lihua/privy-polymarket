import { describe, expect, it } from "vitest";
import {
	calculateFeeBreakdown,
	parseUsdcMicros,
	usdcMicrosToDecimalString,
} from "@/lib/server/fee-math";

describe("fee math", () => {
	it("parses USDC strings into integer micros", () => {
		expect(parseUsdcMicros("100")).toBe(100_000_000n);
		expect(parseUsdcMicros("2.01")).toBe(2_010_000n);
		expect(parseUsdcMicros("0.000001")).toBe(1n);
	});

	it("calculates inclusive fees with floor rounding", () => {
		expect(calculateFeeBreakdown(100_000_000n, 100)).toEqual({
			totalAmountUsdcMicros: 100_000_000n,
			feeAmountUsdcMicros: 1_000_000n,
			orderAmountUsdcMicros: 99_000_000n,
		});

		expect(calculateFeeBreakdown(2_000_000n, 100)).toEqual({
			totalAmountUsdcMicros: 2_000_000n,
			feeAmountUsdcMicros: 20_000n,
			orderAmountUsdcMicros: 1_980_000n,
		});
	});

	it("formats micros without floating point math", () => {
		expect(usdcMicrosToDecimalString(99_000_000n)).toBe("99");
		expect(usdcMicrosToDecimalString(1_980_000n)).toBe("1.98");
		expect(usdcMicrosToDecimalString(1n)).toBe("0.000001");
	});
});
