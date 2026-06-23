import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/server/auth";
import { getUserBuilderCredentials } from "@/lib/server/builder-credentials";
import { logError } from "@/lib/server/logger";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePrivyAuth(request);
    const configured = Boolean(
      await getUserBuilderCredentials(auth.privyUserId)
    );

    return NextResponse.json({ configured });
  } catch (error) {
    logError(error, { event: "api_builder_credentials_status_failed" });
    return NextResponse.json(
      {
        configured: false,
        error: "Failed to check builder credentials",
      },
      { status: 401 }
    );
  }
}
