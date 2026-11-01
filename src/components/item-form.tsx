"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  api, describeWithKeywords, errorMessage, type Classification,
} from "@/lib/api-client";
import type { Box, Item } from "@/lib/types";
import { BarcodeScanner } from "./barcode-scanner";
import { useT } from "./i18n-provider";

const MAX_PHOTOS = 10;
const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ItemForm({
  boxes,
  item,
  defaultBoxId,
}: {
  boxes: Box[];
  item?: Item;
  defaultBoxId?: number;
}) {
  const t = useT();
  const router = useRouter();
  const [boxId, setBoxId] = useState<number>(item?.box_id ?? defaultBoxId ?? boxes[0]?.id ?? 0);
  const [name, setName] = useState(item?.name ?? "");
  const [isCollection, setIsCollection] = useState(item?.is_collection ?? false);
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? "");
  const [ean, setEan] = useState(item?.ean ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [photos, setPhotos] = useState<string[]>(item?.photos ?? []);
  const [uploading, setUploading] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const onScan = useCallback((v: string) => setEan(v), []);

  async function upload(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const { filename } = await api<{ filename: string }>("/api/photos", {
          method: "POST",
          body: fd,
        });
        setPhotos((p) => [...p, filename]);
      } catch {
        toast.error(t("item.photo.failed"));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function detect() {
    if (photos.length === 0) return toast.error(t("item.detect.needPhoto"));
    setDetecting(true);
    try {
      const hint = [
        name && `Name given by the owner: ${name}`,
        notes && `Owner's notes: ${notes}`,
      ]
        .filter(Boolean)
        .join("\n");
      const r = await api<Classification>("/api/classify", {
        method: "POST",
        body: JSON.stringify({
          photos,
          hint: hint || undefined,
          box_id: boxId || undefined,
          collection: isCollection,
        }),
      });
      setDescription(describeWithKeywords(t, r));
      if (!name.trim()) setName(r.name);
      if (!isCollection && !quantity && r.quantity) setQuantity(String(r.quantity));
      toast.success(t("item.detect.done"));
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setDetecting(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !boxId) return;
    setSaving(true);
    try {
      const body = JSON.stringify({
        box_id: boxId,
        name,
        is_collection: isCollection,
        quantity: isCollection || quantity.trim() === "" ? null : Math.max(0, Math.round(Number(quantity))),
        ean: ean.trim() || null,
        description,
        notes,
        photos,
      });
      const saved = item
        ? await api<Item>(`/api/items/${item.id}`, { method: "PATCH", body })
        : await api<Item>("/api/items", { method: "POST", body });
      toast.success(t("item.saved"));
      router.push(`/item/${saved.id}`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(t, err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 pb-8">
      <div className="space-y-1.5">
        <Label htmlFor="box">{t("item.box")}</Label>
        <select id="box" value={boxId} onChange={(e) => setBoxId(Number(e.target.value))} className={selectClass}>
          {boxes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <label className="plate flex cursor-pointer items-start gap-3 p-3">
        <Checkbox
          checked={isCollection}
          onCheckedChange={(c) => setIsCollection(c === true)}
          className="mt-0.5 size-5"
        />
        <span className="space-y-0.5">
          <span className="block font-semibold">{t("item.collection")}</span>
          <span className="block text-sm text-muted-foreground">{t("item.collection.help")}</span>
        </span>
      </label>

      <div className="space-y-2">
        <Label>{t("item.photos")}</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p, i) => (
            <div key={p} className="plate relative aspect-square overflow-hidden">
              <Image src={`/api/photos/${p}?thumb=1`} alt="" fill unoptimized sizes="20vw" className="object-cover" />
              <button
                type="button"
                aria-label={t("item.photo.remove")}
                onClick={() => setPhotos((all) => all.filter((x) => x !== p))}
                className="absolute right-1 top-1 grid size-8 place-items-center rounded-sm bg-black/70 text-white"
              >
                <X className="size-4" />
              </button>
              {i === 0 && <span className="absolute bottom-1 left-1 rounded-sm bg-primary px-1 text-xs font-semibold text-primary-foreground">1</span>}
            </div>
          ))}
          {uploading > 0 && (
            <div className="plate grid aspect-square place-items-center text-muted-foreground" aria-label={t("item.photo.uploading")}>
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
          <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
          <Button type="button" className="h-11" disabled={photos.length >= MAX_PHOTOS} onClick={() => cameraRef.current?.click()}>
            <Camera /> {t("item.photo.take")}
          </Button>
          <Button type="button" variant="outline" className="h-11" disabled={photos.length >= MAX_PHOTOS} onClick={() => galleryRef.current?.click()}>
            <ImagePlus /> {t("item.photo.pick")}
          </Button>
          <Button type="button" variant="secondary" className="h-11" disabled={detecting || uploading > 0 || photos.length === 0} onClick={detect}>
            {detecting ? <Loader2 className="animate-spin" /> : <Sparkles />} {t("item.detect")}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("item.name")}</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t(isCollection ? "item.namePlaceholderCollection" : "item.namePlaceholder")} maxLength={200} className="h-11 text-base" />
      </div>

      <div className={isCollection ? "space-y-4" : "grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]"}>
        {!isCollection && (
          <div className="space-y-1.5">
            <Label htmlFor="qty">{t("item.quantity")}</Label>
            <Input id="qty" type="number" inputMode="numeric" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-11 text-base" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="ean">{t("item.ean")}</Label>
          <div className="flex gap-2">
            <Input id="ean" inputMode="numeric" value={ean} onChange={(e) => setEan(e.target.value)} maxLength={32} className="h-11 flex-1 text-base" />
            <BarcodeScanner onDetect={onScan} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">{t("item.notes")}</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-base" />
        <p className="text-xs text-muted-foreground">{t("item.notes.help")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">{t("item.description")}</Label>
        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={isCollection ? 12 : 6} className="text-base" />
        <p className="text-xs text-muted-foreground">{t("item.description.help")}</p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="h-12 flex-1 text-base font-semibold" disabled={saving || uploading > 0 || !name.trim()}>
          {saving && <Loader2 className="animate-spin" />} {t("common.save")}
        </Button>
        <Button type="button" variant="outline" className="h-12" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
