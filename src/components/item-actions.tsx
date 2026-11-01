"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  api, describeWithKeywords, errorMessage, type Classification,
} from "@/lib/api-client";
import type { Item } from "@/lib/types";
import { useT } from "./i18n-provider";

export function ItemActions({ item }: { item: Item }) {
  const t = useT();
  const router = useRouter();
  const [delOpen, setDelOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // regenerate dialog state
  const [notes, setNotes] = useState(item.notes);
  const [hint, setHint] = useState("");
  const [proposal, setProposal] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/items/${item.id}`, { method: "DELETE" });
      toast.success(t("item.deleted"));
      router.push(`/box/${item.box_id}`);
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(t, e));
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    try {
      const r = await api<Classification>(`/api/items/${item.id}/describe`, {
        method: "POST",
        body: JSON.stringify({ notes, hint: hint.trim() || undefined }),
      });
      setProposal(describeWithKeywords(t, r));
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (proposal === null) return;
    setBusy(true);
    try {
      await api(`/api/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ description: proposal, notes }),
      });
      toast.success(t("item.regenerate.applied"));
      setRegenOpen(false);
      setProposal(null);
      setHint("");
      router.refresh();
    } catch (e) {
      toast.error(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {item.photos.length > 0 && (
        <Button variant="secondary" className="h-11" onClick={() => setRegenOpen(true)}>
          <Sparkles /> {t("item.regenerate")}
        </Button>
      )}
      <Button variant="destructive" className="h-11" onClick={() => setDelOpen(true)}>
        <Trash2 /> {t("common.delete")}
      </Button>

      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("item.regenerate.title")}</DialogTitle>
            <DialogDescription>{t("item.regenerate.help")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="regen-notes">{t("item.notes")}</Label>
              <Textarea id="regen-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="regen-hint">{t("item.regenerate.hint")}</Label>
              <Input id="regen-hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder={t("item.regenerate.hintPlaceholder")} maxLength={500} className="h-11 text-base" />
            </div>
            {proposal !== null && (
              <div className="space-y-1.5">
                <Label htmlFor="regen-proposal">{t("item.regenerate.proposal")}</Label>
                <Textarea id="regen-proposal" rows={8} value={proposal} onChange={(e) => setProposal(e.target.value)} className="text-base" />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11" disabled={busy} onClick={generate}>
              {busy && proposal === null ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {t("item.regenerate.run")}
            </Button>
            {proposal !== null && (
              <Button className="h-11" disabled={busy} onClick={apply}>
                {t("item.regenerate.apply")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("item.deleteTitle", { name: item.name })}</DialogTitle>
            <DialogDescription>{t("item.deleteWarn")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11" onClick={() => setDelOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="h-11" disabled={busy} onClick={remove}>
              {t("item.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
