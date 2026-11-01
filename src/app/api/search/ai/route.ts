import { z } from "zod";
import { NextResponse } from "next/server";
import { aiSearch } from "@/lib/claude";
import { listItems } from "@/lib/repo";
import { body, claudeErr, localeFrom } from "@/lib/http";

const schema = z.object({ q: z.string().trim().min(2).max(500) });

/** Optional, explicit-only: sends the inventory (without photos) as JSON to Claude. */
export async function POST(req: Request) {
  const b = await body(req, schema);
  if ("error" in b) return b.error;
  const items = listItems();
  if (items.length === 0) return NextResponse.json({ answer: "", matches: [] });
  try {
    const r = await aiSearch(items, b.data.q, localeFrom(req));
    const byId = new Map(items.map((i) => [i.id, i]));
    return NextResponse.json({
      answer: r.answer,
      matches: r.matches.map((m) => ({ reason: m.reason, item: byId.get(m.id) })),
    });
  } catch (e) {
    return claudeErr(e);
  }
}
