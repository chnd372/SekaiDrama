
import { encryptedResponse, safeJson } from "@/lib/api-utils";
import { cachedFetch } from "@/lib/upstream-cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = searchParams.get("offset") || "0";

    const res = await cachedFetch("src/app/api/freereels/foryou/route.ts", `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api"}/freereels/foryou?offset=${offset}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: 'no-store'
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    const data = await res.json();
    return encryptedResponse(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
