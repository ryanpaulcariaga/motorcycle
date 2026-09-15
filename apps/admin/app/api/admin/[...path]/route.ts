import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { mintFirstPartyToken } from "@/lib/first-party-token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7240";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ message: "Sign-in required." }, { status: 401 });

  const token = await mintFirstPartyToken(session);
  const { path } = await context.params;
  const target = `${API_BASE_URL}/api/admin/${path.join("/")}${new URL(request.url).search}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const response = await fetch(target, {
    method: request.method,
    body,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return new NextResponse(response.body, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
