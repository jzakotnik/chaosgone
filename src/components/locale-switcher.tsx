"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions";
import { useI18n } from "./i18n-provider";
import { LOCALES } from "@/lib/locales";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label={t("nav.language")} className="flex overflow-hidden rounded-sm border border-white/30">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={l === locale}
          onClick={() =>
            start(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={cn(
            "px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
            l === locale ? "bg-primary text-primary-foreground" : "hover:bg-white/10",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
