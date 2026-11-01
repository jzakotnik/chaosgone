"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api-client";
import type { Item } from "@/lib/types";
import { useT } from "./i18n-provider";

/** Shown on items that still need review. In review flow it jumps to the next unreviewed item. */
export function ReviewBar({ itemId, flow }: { itemId: number; flow: boolean }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markReviewed() {
    setBusy(true);
    try {
      await api(`/api/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ needs_review: false }) });
      if (flow) {
        const left = await api<Item[]>("/api/items?review=1");
        if (left.length > 0) {
          router.push(`/item/${left[0].id}?review=1`);
        } else {
          toast.success(t("review.finished"));
          router.push("/");
        }
      } else {
        router.refresh();
      }
    } catch (e) {
      toast.error(errorMessage(t, e));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border-2 border-accent bg-accent/30 p-3">
      <p className="min-w-0 flex-1 basis-56 text-sm font-medium">{t("review.hint")}</p>
      <Button className="h-11" disabled={busy} onClick={markReviewed}>
        <CheckCheck /> {t(flow ? "review.next" : "review.markReviewed")}
      </Button>
    </div>
  );
}
