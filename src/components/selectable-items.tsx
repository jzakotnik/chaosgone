"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, CheckSquare, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, errorMessage } from "@/lib/api-client";
import type { Box, Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "./i18n-provider";
import { ItemCard } from "./item-card";

const selectClass =
  "h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Item grid with a "select" mode: tap items, then move them to another box.
 * Used on the box page, the review list and the search results.
 */
export function SelectableItems({
  items,
  boxes,
  currentBoxId,
  reviewFlow = false,
}: {
  items: Item[];
  boxes: Box[];
  /** On a box page: that box is not offered as a destination. */
  currentBoxId?: number;
  /** Cards link into the review flow (`?review=1`). */
  reviewFlow?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const destinations = useMemo(() => boxes.filter((b) => b.id !== currentBoxId), [boxes, currentBoxId]);
  const [dest, setDest] = useState<number>(destinations[0]?.id ?? 0);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggle(id: number) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function stop() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function bulk(body: { action: "move"; item_ids: number[]; box_id: number } | { action: "mark_reviewed" | "delete"; item_ids: number[] }) {
    await api("/api/items/bulk", { method: "POST", body: JSON.stringify(body) });
  }
  const post = (ids: number[], boxId: number) => bulk({ action: "move", item_ids: ids, box_id: boxId });

  /** Mark-as-reviewed and delete: no undo for these, so delete asks first (see the dialog). */
  async function simpleAction(action: "mark_reviewed" | "delete") {
    const ids = [...selected];
    setBusy(true);
    try {
      await bulk({ action, item_ids: ids });
      toast.success(t(action === "delete" ? "select.deleted" : "select.reviewed", { count: ids.length }));
      setConfirmDelete(false);
      stop();
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }
  const anyToReview = items.some((i) => selected.has(i.id) && i.needs_review);

  async function move() {
    if (selected.size === 0 || !dest) return;
    // Remember where everything came from, for "Undo" (items may come from several boxes).
    const before = items.filter((i) => selected.has(i.id)).map((i) => ({ id: i.id, box_id: i.box_id }));
    const target = boxes.find((b) => b.id === dest);
    setBusy(true);
    try {
      await post(before.map((b) => b.id), dest);
      toast.success(t("select.moved", { count: before.length, box: target?.name ?? "" }), {
        duration: 12000,
        action: {
          label: t("select.undo"),
          onClick: async () => {
            try {
              const groups = new Map<number, number[]>();
              for (const b of before) groups.set(b.box_id, [...(groups.get(b.box_id) ?? []), b.id]);
              for (const [boxId, ids] of groups) await post(ids, boxId);
              toast.success(t("select.undone"));
              router.refresh();
            } catch (e) {
              toast.error(errorMessage(t, e));
            }
          },
        },
      });
      stop();
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button
          variant={selecting ? "secondary" : "outline"}
          className="h-10 border-2 border-input bg-card data-[active=true]:bg-secondary"
          data-active={selecting}
          onClick={() => (selecting ? stop() : setSelecting(true))}
        >
          <CheckSquare /> {t(selecting ? "select.done" : "select.start")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => {
          const on = selected.has(item.id);
          return (
            <div key={item.id} className="relative">
              {/* inert: while selecting, the card must not be focusable/clickable as a link */}
              <div inert={selecting} className={cn(on && "opacity-80")}>
                <ItemCard
                  item={item}
                  href={reviewFlow ? `/item/${item.id}?review=1` : undefined}
                  reviewLabel={t("review.badge")}
                  quantityLabel={item.quantity ? `×${item.quantity}` : undefined}
                />
              </div>
              {selecting && (
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={t("select.toggle", { name: item.name })}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "absolute inset-0 z-10 rounded-md border-4 outline-none focus-visible:ring-4 focus-visible:ring-ring",
                    on ? "border-primary bg-primary/20" : "border-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full border-2",
                      on ? "border-black/40 bg-primary text-primary-foreground" : "border-secondary bg-white/90",
                    )}
                  >
                    {on && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selecting && (
        <>
          <div className="h-44" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-40 bg-secondary text-secondary-foreground shadow-[0_-4px_12px_rgb(0_0_0/0.25)]">
            <div className="hazard-stripe" />
            <div className="mx-auto w-full max-w-5xl space-y-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
              <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                <span aria-live="polite">
                  {selected.size === 0 ? t("select.empty") : t("select.count", { count: selected.size })}
                </span>
                <span className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-8 bg-transparent text-inherit hover:bg-white/10" onClick={() => setSelected(new Set(items.map((i) => i.id)))}>
                    {t("select.all")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 bg-transparent text-inherit hover:bg-white/10" onClick={() => setSelected(new Set())}>
                    {t("select.none")}
                  </Button>
                </span>
              </div>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor="move-dest" className="mb-0.5 block text-xs font-medium text-secondary-foreground/70">
                    {t("select.moveTo")}
                  </label>
                  <select
                    id="move-dest"
                    value={dest}
                    onChange={(e) => setDest(Number(e.target.value))}
                    className={cn(selectClass, "w-full")}
                  >
                    {destinations.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button className="h-11 px-5 text-base font-semibold" disabled={busy || selected.size === 0 || !dest} onClick={move}>
                  {t("select.move")}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={selected.size === 0}
                    aria-label={t("select.actions")}
                    render={<Button variant="outline" className="h-11 w-11 shrink-0 bg-transparent px-0 text-inherit hover:bg-white/10" />}
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="w-60">
                    <DropdownMenuItem disabled={!anyToReview} onClick={() => simpleAction("mark_reviewed")}>
                      <CheckCheck /> {t("select.markReviewed")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                      <Trash2 /> {t("select.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("select.deleteTitle", { count: selected.size })}</DialogTitle>
            <DialogDescription>{t("select.deleteWarn")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11" onClick={() => setConfirmDelete(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="h-11" disabled={busy} onClick={() => simpleAction("delete")}>
              {t("item.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
