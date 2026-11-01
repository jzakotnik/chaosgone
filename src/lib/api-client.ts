import type { TFunction } from "./messages";

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(url, {
    ...init,
    headers: isForm || !init?.body ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(j?.error ?? "error", res.status);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/** Maps an error to a localised message ("err.<code>" if known, else a generic one). */
export function errorMessage(t: TFunction, e: unknown): string {
  const code = e instanceof ApiError ? e.code : "";
  const key = `err.${code}`;
  const msg = t(key);
  return msg === key ? t("common.error") : msg;
}

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
