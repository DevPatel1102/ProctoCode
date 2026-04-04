import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";
import { SESSION_ID_COOKIE_NAME } from "@/lib/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401
      }
    );
  }

  const body = await request.json();
  const sessionIdFromCookie = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  const backendResponse = await fetch(`${getBackendUrl()}/api/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      ...body,
      sessionId:
        typeof body.sessionId === "string" ? body.sessionId : sessionIdFromCookie
    }),
    cache: "no-store"
  });

  const data = await backendResponse.json();

  return NextResponse.json(data, {
    status: backendResponse.status
  });
}
