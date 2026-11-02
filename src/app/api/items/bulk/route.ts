import { z } from "zod";
import { NextResponse } from "next/server";
import { deleteItems, getBox, markReviewed, moveItems } from "@/lib/repo";
import { body, err } from "@/lib/http";

const ids = z.array(z.number().int().positive()).min(1).max(1000);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("move"), item_ids: ids, box_id: z.number().int().positive() }),
  z.object({ action: z.literal("mark_reviewed"), item_ids: ids }),
  z.object({ action: z.literal("delete"), item_ids: ids }),
]);

/** Bulk actions on selected items. Unknown ids are ignored; `affected` is the number of items changed. */
export async function POST(req: Request) {
  const b = await body(req, schema);
  if ("error" in b) return b.error;
  const d = b.data;
  switch (d.action) {
    case "move":
      if (!getBox(d.box_id)) return err(400, "box_not_found");
      return NextResponse.json({ action: d.action, affected: moveItems(d.item_ids, d.box_id) });
    case "mark_reviewed":
      return NextResponse.json({ action: d.action, affected: markReviewed(d.item_ids) });
    case "delete":
      return NextResponse.json({ action: d.action, affected: await deleteItems(d.item_ids) });
  }
}
