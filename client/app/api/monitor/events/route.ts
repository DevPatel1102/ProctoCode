import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url, "http://localhost:3000");
  const sessionId = searchParams.get("sessionId");
  const userId = searchParams.get("userId");
  const backendUrl = new URL(`${getBackendUrl()}/api/monitor/events`);

  if (sessionId) {
    backendUrl.searchParams.set("sessionId", sessionId);
  }

  if (userId) {
    backendUrl.searchParams.set("userId", userId);
  }

  const backendResponse = await fetch(backendUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  const data = await backendResponse.json();

  return NextResponse.json(data, {
    status: backendResponse.status
  });
}
