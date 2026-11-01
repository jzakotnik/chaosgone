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

export { describeWithKeywords, type Classification } from "./describe";
