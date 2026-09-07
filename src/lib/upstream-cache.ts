import { NextResponse } from "next/server";

/**
 * Single-flight + Stale-While-Revalidate Cache Layer.
 * Upstream api.sansekai.my.id diproteksi rate limit 10 req/menit.
 */

type Entry = {
  status: number;
  bodyText: string;
  headers: Record<string, string>;
  ts: number;
  expires: number;
};

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();

const TTL_MS = 60_000; // Cache fresh 1 menit
const STALE_MAX_MS = 30 * 60_000; // Cache stale 30 menit jika upstream error

export async function cachedFetch(
  routeKey: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  // PENTING: cache key HARUS menyertakan URL (query param / bookId)
  // agar tiap drama / search query memiliki cache tersendiri!
  const cacheKey = `${routeKey}::${url}`;
  const now = Date.now();
  const hit = store.get(cacheKey);

  if (hit && now < hit.expires) {
    return new Response(hit.bodyText, {
      status: hit.status,
      headers: hit.headers,
    });
  }

  const active = inflight.get(cacheKey);
  if (active) {
    const entry = await active;
    return new Response(entry.bodyText, {
      status: entry.status,
      headers: entry.headers,
    });
  }

  const task = (async (): Promise<Entry> => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(url, {
        ...init,
        cache: "no-store",
        signal: controller.signal,
      });

      const bodyText = await res.text();
      const headersObj: Record<string, string> = {
        "content-type": res.headers.get("content-type") || "application/json",
      };

      if (res.ok) {
        const entry: Entry = {
          status: res.status,
          bodyText,
          headers: headersObj,
          ts: now,
          expires: now + TTL_MS,
        };
        store.set(cacheKey, entry);
        return entry;
      }

      // Upstream rate limited / error -> pakai stale cache jika ada
      if (hit && now - hit.ts < STALE_MAX_MS) {
        return hit;
      }

      return {
        status: res.status,
        bodyText,
        headers: headersObj,
        ts: now,
        expires: now + 5_000,
      };
    } catch (err) {
      if (hit) return hit;
      throw err;
    } finally {
      clearTimeout(t);
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, task);

  try {
    const entry = await task;
    return new Response(entry.bodyText, {
      status: entry.status,
      headers: entry.headers,
    });
  } catch (err) {
    if (hit) {
      return new Response(hit.bodyText, {
        status: hit.status,
        headers: hit.headers,
      });
    }
    throw err;
  }
}
