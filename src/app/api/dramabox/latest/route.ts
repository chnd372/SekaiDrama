import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { cachedFetch } from "@/lib/upstream-cache";
import { NextResponse } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/dramabox";

export async function GET() {
  try {
    const response = await cachedFetch("dramabox/latest/route.ts", `${UPSTREAM_API}/latest`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: response.status }
      );
    }

    const data = await safeJson(response);
    
    // Filter out items without bookId or bookName to prevent blank cards
    const filteredData = Array.isArray(data) 
      ? data.filter((item: any) => item && item.bookId) 
      : [];

    return encryptedResponse(filteredData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

