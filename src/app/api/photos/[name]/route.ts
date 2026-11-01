import fs from "node:fs/promises";
import { isValidPhotoName, photoPath } from "@/lib/photos";
import { err } from "@/lib/http";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!isValidPhotoName(name)) return err(404, "not_found");
  const thumb = new URL(req.url).searchParams.get("thumb") === "1";
  try {
    const data = await fs.readFile(photoPath(name, thumb));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/jpeg",
        // file names are random UUIDs and never change content
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return err(404, "not_found");
  }
}
