import fs from "node:fs";
import Database from "better-sqlite3";
import { DATA_DIR, DB_PATH, PHOTO_DIR, THUMB_DIR } from "./config";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS boxes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'box',
  color      TEXT NOT NULL DEFAULT 'orange',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  box_id      INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    INTEGER,
  ean         TEXT,
  description TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_items_box ON items(box_id);
CREATE TABLE IF NOT EXISTS item_photos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id  INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_photos_item ON item_photos(item_id);
`;

const g = globalThis as unknown as { __chaosDb?: Database.Database };

export function db(): Database.Database {
  if (!g.__chaosDb) {
    fs.mkdirSync(THUMB_DIR, { recursive: true });
    fs.mkdirSync(PHOTO_DIR, { recursive: true });
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const d = new Database(DB_PATH);
    d.pragma("journal_mode = WAL");
    d.pragma("foreign_keys = ON");
    d.exec(SCHEMA);
    g.__chaosDb = d;
  }
  return g.__chaosDb;
}
