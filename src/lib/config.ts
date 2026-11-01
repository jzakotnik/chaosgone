import path from "node:path";

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
export const PHOTO_DIR = path.join(DATA_DIR, "photos");
export const THUMB_DIR = path.join(PHOTO_DIR, "thumbs");
export const DB_PATH = path.join(DATA_DIR, "chaosgone.db");

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";
