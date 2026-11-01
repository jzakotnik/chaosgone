import { NextResponse } from "next/server";
import { createItem, getBox, listItems } from "@/lib/repo";
import { body, err, itemSchema, parseId } from "@/lib/http";

export async function GET(req: Request) {
  const box = new URL(req.url).searchParams.get("box");
  const boxId = box ? parseId(box) : undefined;
  if (box && !boxId) return err(400, "invalid_box");
  return NextResponse.json(listItems(boxId ?? undefined));
}

export async function POST(req: Request) {
  const b = await body(req, itemSchema);
  if ("error" in b) return b.error;
  if (!getBox(b.data.box_id)) return err(400, "box_not_found");
  return NextResponse.json(createItem(b.data), { status: 201 });
}
