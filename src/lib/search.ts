import type { Item } from "./types";

/** German-aware normalisation: ä→ae, ß→ss, strip remaining diacritics, lowercase. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Very light German/English stemmer: drops common plural/inflection endings. */
export function stem(w: string): string {
  if (w.length <= 4) return w;
  for (const suf of ["ern", "en", "er", "es", "e", "n", "s"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) return w.slice(0, -suf.length);
  }
  return w;
}

export function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem);
}

function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** 0..1 similarity of one query token against one field token. */
function tokenScore(q: string, t: string): number {
  if (q === t) return 1;
  if (q.length >= 3 && t.startsWith(q)) return 0.85;
  if (q.length >= 4 && t.includes(q)) return 0.7; // German compound words
  if (t.length >= 4 && q.length >= 5 && q.includes(t)) return 0.5;
  if (q.length >= 4) {
    const max = q.length >= 8 ? 2 : 1;
    const d = lev(q, t, max);
    if (d <= max) return d === 1 ? 0.55 : 0.4;
  }
  return 0;
}

type Field = { tokens: string[]; weight: number };

function fieldsOf(item: Item): Field[] {
  return [
    { tokens: tokenize(item.name), weight: 6 },
    { tokens: tokenize(item.box_name ?? ""), weight: 3 },
    { tokens: tokenize(item.notes), weight: 2.5 },
    { tokens: tokenize(item.description), weight: 1.5 },
    { tokens: normalize(item.ean ?? "").split(/\D+/).filter(Boolean), weight: 8 },
    { tokens: tokenize(String(item.quantity ?? "")), weight: 0.5 },
    // so that "sammlung" / "sortiment" finds collections
    { tokens: item.is_collection ? ["sammlung", "sortiment", "set"] : [], weight: 2 },
  ];
}

export type SearchHit = { item: Item; score: number };

/**
 * Fuzzy, weighted search over all text fields.
 * Every query word must match somewhere; if nothing matches that strictly,
 * falls back to "any word matches".
 */
export function searchItems(items: Item[], query: string, limit = 50): SearchHit[] {
  const qs = tokenize(query);
  if (qs.length === 0) return [];
  const scored = items.map((item) => {
    const fields = fieldsOf(item);
    let total = 0;
    let matched = 0;
    for (const q of qs) {
      let best = 0;
      for (const f of fields) {
        for (const t of f.tokens) best = Math.max(best, tokenScore(q, t) * f.weight);
      }
      if (best > 0) matched++;
      total += best;
    }
    return { item, score: total, matched };
  });
  const all = scored.filter((s) => s.matched === qs.length);
  const pool = all.length > 0 ? all : scored.filter((s) => s.matched > 0);
  return pool
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item, score }) => ({ item, score }));
}
