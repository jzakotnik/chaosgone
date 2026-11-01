import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import convertHeic from "heic-convert";
import sharp from "sharp";
import { PHOTO_DIR, THUMB_DIR } from "./config";

const NAME_RE = /^[a-f0-9-]{36}\.jpg$/;

export function isValidPhotoName(name: string): boolean {
  return NAME_RE.test(name);
}

export function photoPath(name: string, thumb = false): string {
  if (!isValidPhotoName(name)) throw new Error("Invalid photo name");
  return path.join(thumb ? THUMB_DIR : PHOTO_DIR, name);
}

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"];

/** iPhone HEIC/HEIF? (ISO-BMFF `ftyp` box with a HEVC-style brand; AVIF is handled by sharp.) */
export function isHeic(buf: Buffer): boolean {
  return buf.length > 12 && buf.toString("latin1", 4, 8) === "ftyp" &&
    HEIC_BRANDS.includes(buf.toString("latin1", 8, 12));
}

/** Normalises orientation, downsizes and stores a photo plus thumbnail. HEIC is converted first. */
export async function savePhoto(original: Buffer): Promise<string> {
  // sharp's prebuilt libvips cannot decode HEVC-based HEIC, so convert it to JPEG first.
  const input = isHeic(original)
    ? Buffer.from(await convertHeic({ buffer: original, format: "JPEG", quality: 0.92 }))
    : original;
  await fs.mkdir(THUMB_DIR, { recursive: true }); // also creates PHOTO_DIR
  const name = `${randomUUID()}.jpg`;
  const base = sharp(input, { failOn: "none" }).rotate();
  await base
    .clone()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(photoPath(name));
  await base
    .clone()
    .resize(480, 480, { fit: "cover" })
    .jpeg({ quality: 75 })
    .toFile(photoPath(name, true));
  return name;
}

export async function deletePhotoFiles(name: string): Promise<void> {
  if (!isValidPhotoName(name)) return;
  await Promise.all([
    fs.rm(photoPath(name), { force: true }),
    fs.rm(photoPath(name, true), { force: true }),
  ]);
}

/** Smaller JPEG (base64) to send to Claude – keeps token cost down. */
export async function photoForClaude(name: string): Promise<string> {
  const buf = await sharp(photoPath(name))
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return buf.toString("base64");
}
