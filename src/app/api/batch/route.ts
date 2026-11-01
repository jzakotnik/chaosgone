import { NextResponse } from "next/server";
import { classifyPhotos, ClaudeError, hasApiKey } from "@/lib/claude";
import { describeWithKeywords } from "@/lib/describe";
import { err, localeFrom } from "@/lib/http";
import { MESSAGES, makeT } from "@/lib/messages";
import { deletePhotoFiles, savePhoto } from "@/lib/photos";
import { createItem, getBox } from "@/lib/repo";

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Batch import, one photo = one item: store the photo, let Claude identify it and save the item
 * flagged "needs review". If Claude fails, the item is still created (named after the file) so no
 * photo is lost; the description can be regenerated later.
 */
export async function POST(req: Request) {
  if (!hasApiKey()) return err(503, "no_api_key", "ANTHROPIC_API_KEY is not set");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const boxId = Number(form?.get("box_id"));
  const collection = form?.get("collection") === "1";
  if (!(file instanceof File)) return err(400, "file_missing");
  if (file.size > MAX_BYTES) return err(413, "file_too_large");
  const box = Number.isInteger(boxId) ? getBox(boxId) : undefined;
  if (!box) return err(400, "box_not_found");

  const locale = localeFrom(req);
  let filename: string;
  try {
    filename = await savePhoto(Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    console.error("batch: photo processing failed:", e);
    return err(415, "unsupported_image");
  }

  const fallbackName = file.name.replace(/\.[^.]+$/, "").slice(0, 200) || "?";
  try {
    const c = await classifyPhotos([filename], { locale, boxName: box.name, collection });
    const item = createItem({
      box_id: box.id,
      name: c.name.trim() || fallbackName,
      quantity: collection ? null : c.quantity,
      description: describeWithKeywords(makeT(MESSAGES[locale]), c),
      is_collection: collection,
      needs_review: true,
      photos: [filename],
    });
    return NextResponse.json({ item, ai: "ok" }, { status: 201 });
  } catch (e) {
    if (!(e instanceof ClaudeError)) {
      await deletePhotoFiles(filename);
      throw e;
    }
    console.error("batch: Claude failed:", e.code, e.message);
    const item = createItem({
      box_id: box.id,
      name: fallbackName,
      is_collection: collection,
      needs_review: true,
      photos: [filename],
    });
    return NextResponse.json({ item, ai: "failed", ai_error: e.code }, { status: 201 });
  }
}
