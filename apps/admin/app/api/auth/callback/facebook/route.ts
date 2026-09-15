import { NextResponse } from "next/server";
import { completeFacebookSignIn } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.redirect(new URL("/?error=oauth_cancelled", request.url));

  try {
    await completeFacebookSignIn(code, state);
    return NextResponse.redirect(new URL("/admin", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed.";
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, request.url));
  }
}
