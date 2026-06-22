import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(
    (process.env.POLY_BUILDER_API_KEY ||
      process.env.POLYMARKET_BUILDER_API_KEY) &&
      (process.env.POLY_BUILDER_SECRET ||
        process.env.POLYMARKET_BUILDER_SECRET) &&
      (process.env.POLY_BUILDER_PASSPHRASE ||
        process.env.POLYMARKET_BUILDER_PASSPHRASE)
  );

  return NextResponse.json({ configured });
}
