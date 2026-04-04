import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";
import { SESSION_ID_COOKIE_NAME } from "@/lib/session";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { searchParams } = new URL(request.url);
  const sessionId =
    searchParams.get("sessionId") ?? cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (!token || !sessionId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await fetch(
    `${getBackendUrl()}/api/trust-score/current?sessionId=${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    }
  );

  const data = await backendResponse.json();

  return NextResponse.json(data, {
    status: backendResponse.status
  });
}
