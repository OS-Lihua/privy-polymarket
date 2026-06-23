import { NextRequest, NextResponse } from "next/server";
import { buildHmacSignature } from "@polymarket/builder-signing-sdk";
import { requirePrivyAuth } from "@/lib/server/auth";
import { getUserBuilderCredentials } from "@/lib/server/builder-credentials";
import { logError } from "@/lib/server/logger";

// This route is used to sign messages for builder authentication (RelayClient) or order attribution (ClobClient)

export async function POST(request: NextRequest) {
	try {
		const auth = await requirePrivyAuth(request);
		const builderCredentials = await getUserBuilderCredentials(
			auth.privyUserId,
		);
		const body = await request.json();
		const { method, path, body: requestBody } = body;

		if (!builderCredentials) {
			return NextResponse.json(
				{ error: "Builder credentials not configured for this user" },
				{ status: 401 },
			);
		}

		if (!method || !path) {
			return NextResponse.json(
				{ error: "Missing required parameters: method, path" },
				{ status: 400 },
			);
		}

		const sigTimestamp = Date.now().toString();

		const signature = buildHmacSignature(
			builderCredentials.secret,
			parseInt(sigTimestamp),
			method,
			path,
			requestBody,
		);

		return NextResponse.json({
			POLY_BUILDER_SIGNATURE: signature,
			POLY_BUILDER_TIMESTAMP: sigTimestamp,
			POLY_BUILDER_API_KEY: builderCredentials.key,
			POLY_BUILDER_PASSPHRASE: builderCredentials.passphrase,
		});
	} catch (error) {
		logError(error, { event: "api_builder_sign_failed" });
		return NextResponse.json(
			{ error: "Failed to sign message" },
			{ status: 500 },
		);
	}
}
