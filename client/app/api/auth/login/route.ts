import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";
import {
  SESSION_CODE_COOKIE_NAME,
  SESSION_ID_COOKIE_NAME
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const backendResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
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

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  cookieStore.delete(SESSION_ID_COOKIE_NAME);
  cookieStore.delete(SESSION_CODE_COOKIE_NAME);

  return NextResponse.json({
    user: data.user
  });
}
