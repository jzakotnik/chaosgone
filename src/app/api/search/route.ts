import { NextResponse } from "next/server";
import { listItems } from "@/lib/repo";
import { searchItems } from "@/lib/search";

/** Local, free search – no Claude call. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const hits = searchItems(listItems(), q);
  return NextResponse.json(hits.map((h) => ({ ...h.item, score: h.score })));
}
