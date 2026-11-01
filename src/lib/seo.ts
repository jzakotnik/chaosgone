import type { Metadata } from "next";
import { headers } from "next/headers";
import type { Locale } from "./locales";
import type { TFunction } from "./messages";

export const SITE_NAME = "ChaosGone";
export const DEFAULT_OG_IMAGE = "/og-default.png"; // 1200x630, in /public

/**
 * Absolute base URL for share previews. Taken from the request (works behind a reverse proxy that sets
 * X-Forwarded-Host/Proto), or from SITE_URL if you want to pin it.
 */
export async function siteUrl(): Promise<URL> {
  if (process.env.SITE_URL) {
    try {
      return new URL(process.env.SITE_URL);
    } catch {
      /* fall through to the request */
    }
  }
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3500").split(",")[0].trim();
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  return new URL(`${proto}://${host}`);
}

/** One-line plain-text summary of a description (no bullets, no keyword line), at most `max` chars. */
export function summarize(text: string, max = 160): string {
  const first = text.split(/\n\s*\n/)[0] ?? "";
  const flat = first.replace(/^\s*[-*•]\s+/gm, "").replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

type Input = {
  t: TFunction;
  locale: Locale;
  /** Page title; the site name is appended. Omit for the home page. */
  title?: string;
  description?: string;
  /** Path or absolute URL of the preview image; defaults to the ChaosGone card. */
  image?: string;
  path?: string;
};

/** Complete title/description/Open Graph/Twitter block (nested objects are replaced, not merged, by Next). */
export function pageMetadata({ t, locale, title, description, image, path }: Input): Metadata {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} – ${t("app.tagline")}`;
  const desc = description || t("meta.description");
  const images = [
    image
      ? { url: image, alt: title ?? SITE_NAME }
      : { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: t("meta.imageAlt") },
  ];
  return {
    title,
    description: desc,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "de" ? "de_DE" : "en_GB",
      title: fullTitle,
      description: desc,
      url: path,
      images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc, images },
  };
}
