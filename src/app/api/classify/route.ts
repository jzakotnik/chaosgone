import { z } from "zod";
import { NextResponse } from "next/server";
import { classifyPhotos } from "@/lib/claude";
import { getBox } from "@/lib/repo";
import { isValidPhotoName } from "@/lib/photos";
import { body, claudeErr, err, localeFrom, photoName } from "@/lib/http";

const schema = z.object({
  photos: z.array(photoName).min(1).max(4),
  hint: z.string().max(2000).optional(),
  box_id: z.number().int().positive().optional(),
  collection: z.boolean().optional(),
});

export async function POST(req: Request) {
  const b = await body(req, schema);
  if ("error" in b) return b.error;
  const { photos, hint, box_id, collection } = b.data;
  if (!photos.every(isValidPhotoName)) return err(400, "invalid_photo");
  try {
    const result = await classifyPhotos(photos, {
      locale: localeFrom(req),
      hint,
      collection,
      boxName: box_id ? getBox(box_id)?.name : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return err(404, "photo_not_found");
    return claudeErr(e);
  }
}
