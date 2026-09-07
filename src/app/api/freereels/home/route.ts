
import { encryptedResponse, safeJson } from "@/lib/api-utils";
import { cachedFetch } from "@/lib/upstream-cache";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await cachedFetch("src/app/api/freereels/home/route.ts", `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api"}/freereels/homepage`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    const data = await safeJson(res);
    return encryptedResponse(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
