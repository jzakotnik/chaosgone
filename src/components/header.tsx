import Link from "next/link";
import { Wrench } from "lucide-react";
import { getT } from "@/lib/i18n";
import { LocaleSwitcher } from "./locale-switcher";

export async function Header() {
  const { t } = await getT();
  return (
    <header className="sticky top-0 z-30 bg-secondary text-secondary-foreground shadow-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label={t("nav.home")}>
          <span className="grid size-9 place-items-center rounded-sm bg-primary text-primary-foreground">
            <Wrench className="size-5" strokeWidth={2.5} />
          </span>
          <span className="font-stencil text-xl leading-none tracking-wider">{t("app.name")}</span>
          <span className="hidden text-sm text-secondary-foreground/70 sm:inline">
            · {t("app.tagline")}
          </span>
        </Link>
        <LocaleSwitcher />
      </div>
      <div className="hazard-stripe" />
    </header>
  );
}
