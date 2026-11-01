import { NextResponse } from "next/server";
import { z } from "zod";
import { ClaudeError } from "./claude";

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

export function localeFrom(req: Request): Locale {
  const m = /(?:^|;\s*)locale=(\w+)/.exec(req.headers.get("cookie") ?? "");
  return LOCALES.includes(m?.[1] as Locale) ? (m![1] as Locale) : DEFAULT_LOCALE;
}

export function err(status: number, code: string, message?: string) {
  return NextResponse.json({ error: code, message }, { status });
}

export function parseId(s: string): number | null {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function body<T extends z.ZodType>(req: Request, schema: T) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { error: err(400, "invalid_json") } as const;
  }
  const r = schema.safeParse(json);
  if (!r.success) {
    return { error: err(400, "validation_failed", r.error.issues[0]?.message) } as const;
  }
  return { data: r.data as z.infer<T> } as const;
}

export function claudeErr(e: unknown) {
  if (e instanceof ClaudeError) {
    const status = e.code === "no_api_key" ? 503 : e.code === "refused" ? 422 : 502;
    return err(status, e.code, e.message);
  }
  throw e;
}

const photoName = z.string().regex(/^[a-f0-9-]{36}\.jpg$/);
export const itemSchema = z.object({
  box_id: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(0).nullable().optional(),
  ean: z.string().max(32).nullable().optional(),
  description: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  photos: z.array(photoName).max(10).optional(),
});
export const boxSchema = z.object({
  name: z.string().trim().min(1).max(100),
  icon: z.string().max(40).optional(),
  color: z.string().max(40).optional(),
});
export { photoName };
