import { NextRequest } from "next/server";
import { encryptedResponse } from "@/lib/api-utils";
import { cachedFetch } from "@/lib/upstream-cache";

const UPSTREAM_API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api";

export async function GET(req: NextRequest) {
  try {
    const bookId = req.nextUrl.searchParams.get("bookId");

    if (!bookId) {
      return encryptedResponse({ status: 400, message: "bookId is required", data: null }, 400);
    }

    const res = await cachedFetch("src/app/api/goodshort/allepisode/route.ts", `${UPSTREAM_API}/goodshort/allepisode?bookId=${bookId}`, {
      headers: {
        "User-Agent": "okhttp/4.12.0",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch goodshort allepisode: ${res.status}`);
    }

    const data = await res.json();
    return encryptedResponse(data);
  } catch (error) {
    console.error("GoodShort allepisode fetch error:", error);
    return encryptedResponse(
      { status: 500, message: "Failed to fetch episodes from GoodShort", data: null },
      500
    );
  }
}
