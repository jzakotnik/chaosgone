import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
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

/** Normalises orientation, downsizes and stores a photo plus thumbnail. */
export async function savePhoto(input: Buffer): Promise<string> {
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
