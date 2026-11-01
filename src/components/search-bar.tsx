"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "./i18n-provider";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const t = useT();
  return (
    <form action="/search" role="search" className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={t("search.placeholder")}
          aria-label={t("search.button")}
          className="h-12 bg-card pl-10 text-base md:text-base"
        />
      </div>
      <Button type="submit" className="h-12 px-5 text-base font-semibold">
        {t("search.button")}
      </Button>
    </form>
  );
}
