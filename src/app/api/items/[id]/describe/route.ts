import { z } from "zod";
import { NextResponse } from "next/server";
import { classifyPhotos } from "@/lib/claude";
import { getItem } from "@/lib/repo";
import { body, claudeErr, err, localeFrom, parseId } from "@/lib/http";

const schema = z.object({
  /** The owner's current info about the item; defaults to the saved notes. */
  notes: z.string().max(5000).optional(),
  /** One-off extra hint for this run only. */
  hint: z.string().max(500).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * Regenerates the AI description of an existing item from its photos plus
 * everything the owner told us. Returns a proposal; nothing is saved here.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  const item = id ? getItem(id) : undefined;
  if (!item) return err(404, "not_found");
  if (item.photos.length === 0) return err(422, "no_photos");
  const b = await body(req, schema);
  if ("error" in b) return b.error;

  const hint = [
    `Name given by the owner: ${item.name}`,
    item.quantity ? `Quantity: ${item.quantity}` : "",
    item.ean ? `EAN/barcode: ${item.ean}` : "",
    (b.data.notes ?? item.notes) && `Owner's notes: ${b.data.notes ?? item.notes}`,
    b.data.hint && `Extra hint: ${b.data.hint}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await classifyPhotos(item.photos, {
      locale: localeFrom(req),
      hint,
      boxName: item.box_name,
    });
    return NextResponse.json(result);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return err(404, "photo_not_found");
    return claudeErr(e);
  }
}
