"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api-client";
import { BOX_COLORS, BOX_ICONS, boxTone } from "@/lib/box-style";
import type { Box } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "./i18n-provider";

export function BoxDialog({ box }: { box?: Box }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(box?.name ?? "");
  const [icon, setIcon] = useState(box?.icon ?? "box");
  const [color, setColor] = useState(box?.color ?? "orange");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const body = JSON.stringify({ name, icon, color });
      if (box) {
        await api(`/api/boxes/${box.id}`, { method: "PATCH", body });
      } else {
        await api("/api/boxes", { method: "POST", body });
        setName("");
      }
      toast.success(t("box.saved"));
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!box) return;
    setBusy(true);
    try {
      await api(`/api/boxes/${box.id}`, { method: "DELETE" });
      toast.success(t("box.deleted"));
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {box ? (
        <Button variant="outline" className="h-10" onClick={() => setOpen(true)}>
          <Pencil /> {t("common.edit")}
        </Button>
      ) : (
        <Button variant="secondary" className="h-10" onClick={() => setOpen(true)}>
          <Plus /> {t("home.addBox")}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirmDelete(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{box ? t("box.editTitle") : t("box.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="box-name">{t("box.name")}</Label>
              <Input
                id="box-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("box.namePlaceholder")}
                maxLength={100}
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("box.icon")}</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {Object.entries(BOX_ICONS).map(([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={icon === key}
                    aria-label={key}
                    onClick={() => setIcon(key)}
                    className={cn(
                      "grid h-11 place-items-center rounded-sm border-2",
                      icon === key ? "border-primary bg-primary/20" : "border-border bg-card",
                    )}
                  >
                    <Icon className="size-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("box.color")}</Label>
              <div className="flex flex-wrap gap-2">
                {BOX_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={color === c}
                    aria-label={t(`color.${c}`)}
                    title={t(`color.${c}`)}
                    onClick={() => setColor(c)}
                    className={cn(
                      boxTone(c),
                      "size-10 rounded-sm bg-[var(--tone)] ring-offset-2",
                      color === c ? "ring-2 ring-foreground" : "ring-1 ring-black/30",
                    )}
                  />
                ))}
              </div>
            </div>
            {box && confirmDelete && (
              <p className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <strong>{t("box.deleteTitle", { name: box.name })}</strong>
                <br />
                {t("box.deleteWarn", { count: box.item_count ?? 0 })}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {box ? (
              <Button
                variant="destructive"
                className="h-11"
                disabled={busy}
                onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
              >
                {confirmDelete ? t("item.deleteConfirm") : t("common.delete")}
              </Button>
            ) : (
              <span />
            )}
            <Button className="h-11 px-6" disabled={busy || !name.trim()} onClick={save}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
