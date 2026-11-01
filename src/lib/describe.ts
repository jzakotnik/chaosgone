import type { TFunction } from "./messages";

export type Classification = {
  name: string;
  description: string;
  keywords: string[];
  quantity: number | null;
  contents?: { name: string; quantity: number | null; detail: string }[];
};

/**
 * Description text: intro, then (for collections) a "- " list of the contents, then a keywords
 * line, so that contents and keywords are searchable.
 */
export function describeWithKeywords(t: TFunction, c: Classification): string {
  const parts = [c.description];
  if (c.contents && c.contents.length > 0) {
    const lines = c.contents.map(
      (e) =>
        `- ${e.quantity ? `${e.quantity}× ` : ""}${e.name}${e.detail ? ` – ${e.detail}` : ""}`,
    );
    parts.push(`${t("item.contents")}:\n${lines.join("\n")}`);
  }
  if (c.keywords.length > 0) parts.push(`${t("item.keywords")}: ${c.keywords.join(", ")}`);
  return parts.join("\n\n");
}
