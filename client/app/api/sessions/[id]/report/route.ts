import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendUrl } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const backendResponse = await fetch(`${getBackendUrl()}/api/sessions/${id}/report`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!backendResponse.ok) {
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const csvText = await backendResponse.text();

  return new NextResponse(csvText, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": backendResponse.headers.get("Content-Disposition") || `attachment; filename="session_report.csv"`
    }
  });
}
