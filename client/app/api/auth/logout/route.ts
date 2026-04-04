import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  SESSION_CODE_COOKIE_NAME,
  SESSION_ID_COOKIE_NAME
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(SESSION_ID_COOKIE_NAME);
  cookieStore.delete(SESSION_CODE_COOKIE_NAME);

  return NextResponse.redirect(new URL("/login", request.url));
}
