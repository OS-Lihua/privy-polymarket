import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/server/auth";
import { getUserBuilderCredentials } from "@/lib/server/builder-credentials";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePrivyAuth(request);
    const configured = Boolean(
      await getUserBuilderCredentials(auth.privyUserId)
    );

    return NextResponse.json({ configured });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check builder credentials",
      },
      { status: 401 }
    );
  }
}
