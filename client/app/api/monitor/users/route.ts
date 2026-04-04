import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await fetch(`${getBackendUrl()}/api/monitor/users`, {
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
