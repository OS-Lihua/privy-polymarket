import { NextRequest, NextResponse } from "next/server";
import { BLOCKING_ATTEMPT_STATUSES } from "@/lib/server/config";
import { requirePrivyAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { serializeAttempt } from "@/lib/server/serialize";
import { getTraceId, logError } from "@/lib/server/logger";

export async function GET(request: NextRequest) {
	const traceId = getTraceId(request.headers);

	try {
		const auth = await requirePrivyAuth(request);
		const depositWalletAddress = request.nextUrl.searchParams.get(
			"depositWalletAddress",
		);

		const attempt = await prisma.tradeAttempt.findFirst({
			where: {
				privyUserId: auth.privyUserId,
				...(depositWalletAddress ? { depositWalletAddress } : {}),
				status: { in: [...BLOCKING_ATTEMPT_STATUSES] },
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({
			attempt: attempt ? serializeAttempt(attempt) : null,
		});
	} catch (error) {
		logError(error, { event: "api_active_attempt_failed", traceId });
		return NextResponse.json(
			{ error: "Failed to fetch active attempt", traceId },
			{ status: 400 },
		);
	}
}
