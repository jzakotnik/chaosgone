export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

export function isLocale(v: unknown): v is Locale {
  return LOCALES.includes(v as Locale);
}
