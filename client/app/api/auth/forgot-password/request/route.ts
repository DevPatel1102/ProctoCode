import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const backendResponse = await fetch(
    `${getBackendUrl()}/api/auth/forgot-password/request`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    }
  );

  const data = await backendResponse.json();

  return NextResponse.json(data, {
    status: backendResponse.status
  });
}
