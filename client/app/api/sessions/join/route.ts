import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";
import {
  SESSION_CODE_COOKIE_NAME,
  SESSION_ID_COOKIE_NAME
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const backendResponse = await fetch(`${getBackendUrl()}/api/sessions/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, {
      status: backendResponse.status
    });
  }

  cookieStore.set(SESSION_ID_COOKIE_NAME, data.sessionId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  cookieStore.set(SESSION_CODE_COOKIE_NAME, data.sessionCode, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return NextResponse.json(data, {
    status: backendResponse.status
  });
}
