import { db } from "./db";
import { deletePhotoFiles } from "./photos";
import type { Box, Item, ItemInput } from "./types";

type ItemRow = Omit<Item, "photos" | "is_collection"> & {
  photo_list: string | null;
  is_collection: number;
};

const ITEM_SELECT = `
  SELECT i.*, b.name AS box_name,
    (SELECT group_concat(filename, ',') FROM
      (SELECT filename FROM item_photos WHERE item_id = i.id ORDER BY position, id)) AS photo_list
  FROM items i JOIN boxes b ON b.id = i.box_id`;

function toItem(r: ItemRow): Item {
  const { photo_list, ...rest } = r;
  return {
    ...rest,
    is_collection: Boolean(r.is_collection),
    photos: photo_list ? photo_list.split(",") : [],
  };
}

// ---- boxes ----
export function listBoxes(): Box[] {
  return db()
    .prepare(
      `SELECT b.*, (SELECT count(*) FROM items WHERE box_id = b.id) AS item_count
       FROM boxes b ORDER BY b.name COLLATE NOCASE`,
    )
    .all() as Box[];
}

export function getBox(id: number): Box | undefined {
  return db()
    .prepare(
      `SELECT b.*, (SELECT count(*) FROM items WHERE box_id = b.id) AS item_count
       FROM boxes b WHERE b.id = ?`,
    )
    .get(id) as Box | undefined;
}

export function createBox(input: { name: string; icon?: string; color?: string }): Box {
  const r = db()
    .prepare("INSERT INTO boxes (name, icon, color) VALUES (?, ?, ?)")
    .run(input.name.trim(), input.icon ?? "box", input.color ?? "orange");
  return getBox(Number(r.lastInsertRowid))!;
}

export function updateBox(
  id: number,
  input: { name?: string; icon?: string; color?: string },
): Box | undefined {
  const cur = getBox(id);
  if (!cur) return undefined;
  db()
    .prepare("UPDATE boxes SET name = ?, icon = ?, color = ? WHERE id = ?")
    .run(input.name?.trim() || cur.name, input.icon ?? cur.icon, input.color ?? cur.color, id);
  return getBox(id);
}

export async function deleteBox(id: number): Promise<boolean> {
  const photos = db()
    .prepare(
      `SELECT filename FROM item_photos WHERE item_id IN (SELECT id FROM items WHERE box_id = ?)`,
    )
    .all(id) as { filename: string }[];
  const r = db().prepare("DELETE FROM boxes WHERE id = ?").run(id);
  await Promise.all(photos.map((p) => deletePhotoFiles(p.filename)));
  return r.changes > 0;
}

// ---- items ----
export function listItems(boxId?: number): Item[] {
  const rows = (
    boxId === undefined
      ? db().prepare(`${ITEM_SELECT} ORDER BY i.updated_at DESC, i.id DESC`).all()
      : db()
          .prepare(`${ITEM_SELECT} WHERE i.box_id = ? ORDER BY i.updated_at DESC, i.id DESC`)
          .all(boxId)
  ) as ItemRow[];
  return rows.map(toItem);
}

export function getItem(id: number): Item | undefined {
  const r = db().prepare(`${ITEM_SELECT} WHERE i.id = ?`).get(id) as ItemRow | undefined;
  return r ? toItem(r) : undefined;
}

function cleanEan(v: string | null | undefined): string | null {
  const s = (v ?? "").replace(/\s+/g, "");
  return s ? s : null;
}

function writePhotos(itemId: number, photos: string[]) {
  const ins = db().prepare(
    "INSERT INTO item_photos (item_id, filename, position) VALUES (?, ?, ?)",
  );
  photos.forEach((f, i) => ins.run(itemId, f, i));
}

export function createItem(input: ItemInput): Item {
  const tx = db().transaction(() => {
    const r = db()
      .prepare(
        `INSERT INTO items (box_id, name, quantity, ean, description, notes, is_collection)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.box_id,
        input.name.trim(),
        input.is_collection ? null : (input.quantity ?? null),
        cleanEan(input.ean),
        input.description ?? "",
        input.notes ?? "",
        input.is_collection ? 1 : 0,
      );
    const id = Number(r.lastInsertRowid);
    writePhotos(id, input.photos ?? []);
    return id;
  });
  return getItem(tx())!;
}

export async function updateItem(
  id: number,
  input: Partial<ItemInput>,
): Promise<Item | undefined> {
  const cur = getItem(id);
  if (!cur) return undefined;
  const isCollection = input.is_collection ?? cur.is_collection;
  const removed = input.photos ? cur.photos.filter((p) => !input.photos!.includes(p)) : [];
  db().transaction(() => {
    db()
      .prepare(
        `UPDATE items SET box_id = ?, name = ?, quantity = ?, ean = ?, description = ?,
         notes = ?, is_collection = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .run(
        input.box_id ?? cur.box_id,
        input.name?.trim() || cur.name,
        isCollection ? null : input.quantity === undefined ? cur.quantity : input.quantity,
        input.ean === undefined ? cur.ean : cleanEan(input.ean),
        input.description ?? cur.description,
        input.notes ?? cur.notes,
        isCollection ? 1 : 0,
        id,
      );
    if (input.photos) {
      db().prepare("DELETE FROM item_photos WHERE item_id = ?").run(id);
      writePhotos(id, input.photos);
    }
  })();
  await Promise.all(removed.map(deletePhotoFiles));
  return getItem(id);
}

export async function deleteItem(id: number): Promise<boolean> {
  const cur = getItem(id);
  if (!cur) return false;
  db().prepare("DELETE FROM items WHERE id = ?").run(id);
  await Promise.all(cur.photos.map(deletePhotoFiles));
  return true;
}

// ---- housekeeping ----
import fs from "node:fs/promises";
import { PHOTO_DIR } from "./config";

/** Removes uploaded photos that were never attached to an item (older than 24h). */
export async function cleanupOrphanPhotos(): Promise<void> {
  const used = new Set(
    (db().prepare("SELECT filename FROM item_photos").all() as { filename: string }[]).map(
      (r) => r.filename,
    ),
  );
  const cutoff = Date.now() - 24 * 3600 * 1000;
  for (const f of await fs.readdir(PHOTO_DIR)) {
    if (!f.endsWith(".jpg") || used.has(f)) continue;
    const st = await fs.stat(`${PHOTO_DIR}/${f}`);
    if (st.mtimeMs < cutoff) await deletePhotoFiles(f);
  }
}
