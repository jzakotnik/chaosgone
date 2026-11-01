"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api-client";
import type { Item } from "@/lib/types";
import { useT } from "./i18n-provider";
import { ItemCard } from "./item-card";

type AiResult = { answer: string; matches: { reason: string; item: Item }[] };

/** Explicit opt-in: sends the inventory (no photos) to Claude. */
export function AiSearch({ q }: { q: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  async function run() {
    setBusy(true);
    try {
      setResult(await api<AiResult>("/api/search/ai", { method: "POST", body: JSON.stringify({ q }) }));
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="plate space-y-3 border-dashed p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" className="h-11" disabled={busy} onClick={run}>
          <Sparkles /> {busy ? t("search.ai.running") : t("search.ai.button")}
        </Button>
        <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">{t("search.ai.hint")}</p>
      </div>
      {result && (
        <div className="space-y-3 border-t border-border pt-3">
          <h2 className="text-xl font-bold">{t("search.ai.title")}</h2>
          {result.answer && <p className="whitespace-pre-line">{result.answer}</p>}
          {result.matches.length === 0 ? (
            <p className="text-muted-foreground">{t("search.ai.noMatches")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {result.matches.map(({ item, reason }) => (
                <li key={item.id} className="space-y-1">
                  <ItemCard item={item} reviewLabel={t("review.badge")} quantityLabel={item.quantity ? `×${item.quantity}` : undefined} />
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
