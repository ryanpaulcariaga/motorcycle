import { NextResponse } from "next/server";
import { createFacebookSignInUrl } from "@/lib/auth";

export async function GET() {
  const url = await createFacebookSignInUrl();
  return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
}
