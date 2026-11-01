import { savePhoto } from "@/lib/photos";
import { cleanupOrphanPhotos } from "@/lib/repo";
import { err } from "@/lib/http";
import { NextResponse } from "next/server";

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return err(400, "file_missing");
  if (file.size > MAX_BYTES) return err(413, "file_too_large");
  try {
    const filename = await savePhoto(Buffer.from(await file.arrayBuffer()));
    void cleanupOrphanPhotos().catch(() => {});
    return NextResponse.json({ filename }, { status: 201 });
  } catch (e) {
    console.error("photo upload failed:", e);
    return err(415, "unsupported_image");
  }
}
