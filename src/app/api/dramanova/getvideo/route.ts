import { NextResponse } from "next/server";
import { encryptedResponse } from "@/lib/api-utils";
import { cachedFetch } from "@/lib/upstream-cache";

const UPSTREAM_API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    const res = await cachedFetch("src/app/api/dramanova/getvideo/route.ts", `${UPSTREAM_API}/dramanova/getvideo?fileId=${fileId}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch DramaNova video from upstream: ${res.status}`);
    }

    const data = await res.json();
    return encryptedResponse(data);
  } catch (error) {
    console.error("DramaNova getvideo API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
