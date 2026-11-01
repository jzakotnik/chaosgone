import de from "@/messages/de.json";
import en from "@/messages/en.json";
import type { Locale } from "./locales";

export type MessageKey = keyof typeof de;
export type Messages = Record<string, string>;

// Compile-time check: both dictionaries must have exactly the same keys.
const _en: Record<MessageKey, string> = en;
void _en;

export const MESSAGES: Record<Locale, Messages> = { de, en };

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

/** Translator with {param} interpolation and `.one` / `.other` plural suffixes via `count`. */
export function makeT(messages: Messages): TFunction {
  return (key, params) => {
    let k = key;
    if (params && typeof params.count === "number") {
      const plural = `${key}.${params.count === 1 ? "one" : "other"}`;
      if (plural in messages) k = plural;
    }
    const tpl = messages[k] ?? key;
    return params
      ? tpl.replace(/\{(\w+)\}/g, (_, n: string) => String(params[n] ?? `{${n}}`))
      : tpl;
  };
}
