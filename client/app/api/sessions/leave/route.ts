import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";
import {
  SESSION_CODE_COOKIE_NAME,
  SESSION_ID_COOKIE_NAME
} from "@/lib/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const body = await request.json();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await fetch(`${getBackendUrl()}/api/sessions/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const data = await backendResponse.json();

  if (backendResponse.ok) {
    cookieStore.delete(SESSION_ID_COOKIE_NAME);
    cookieStore.delete(SESSION_CODE_COOKIE_NAME);
  }

  return NextResponse.json(data, {
    status: backendResponse.status
  });
}
