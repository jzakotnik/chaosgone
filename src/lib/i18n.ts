import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";
import { MESSAGES, makeT } from "./messages";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("locale")?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: makeT(MESSAGES[locale]) };
}
