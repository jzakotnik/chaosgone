"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle2, CircleDashed, ImagePlus, Loader2, Play, Square, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api, ApiError, errorMessage } from "@/lib/api-client";
import type { Box, Item } from "@/lib/types";
import { useT } from "./i18n-provider";

type State = "waiting" | "running" | "done" | "aiFailed" | "failed";
type Row = { id: number; file: File; state: State; item?: Item; error?: string };

const CONCURRENCY = 2; // gentle on a Raspberry Pi and on API rate limits
const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BatchImport({
  boxes,
  defaultBoxId,
  aiAvailable,
}: {
  boxes: Box[];
  defaultBoxId?: number;
  aiAvailable: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [boxId, setBoxId] = useState(defaultBoxId ?? boxes[0]?.id ?? 0);
  const [collection, setCollection] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const stopRef = useRef(false);
  const nextId = useRef(1);
  const fileRef = useRef<HTMLInputElement>(null);

  // Warn before closing the tab while the batch runs.
  useEffect(() => {
    if (!running) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [running]);

  const counts = useMemo(() => {
    const c = { waiting: 0, running: 0, done: 0, aiFailed: 0, failed: 0 };
    for (const r of rows) c[r.state]++;
    return c;
  }, [rows]);
  const finished = counts.done + counts.aiFailed + counts.failed;

  const patch = (id: number, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map<Row>((file) => ({
      id: nextId.current++,
      file,
      state: "waiting",
    }));
    setRows((rs) => [...rs, ...added]);
  }

  async function run(targets: Row[]) {
    if (targets.length === 0 || !boxId) return;
    stopRef.current = false;
    setFatal(null);
    setRunning(true);
    const queue = [...targets];
    const worker = async () => {
      while (!stopRef.current) {
        const row = queue.shift();
        if (!row) return;
        patch(row.id, { state: "running", error: undefined });
        try {
          const fd = new FormData();
          fd.append("file", row.file);
          fd.append("box_id", String(boxId));
          fd.append("collection", collection ? "1" : "0");
          const r = await api<{ item: Item; ai: "ok" | "failed"; ai_error?: string }>("/api/batch", {
            method: "POST",
            body: fd,
          });
          patch(row.id, {
            state: r.ai === "ok" ? "done" : "aiFailed",
            item: r.item,
            error: r.ai_error,
          });
        } catch (e) {
          if (e instanceof ApiError && e.code === "no_api_key") {
            stopRef.current = true;
            setFatal(t("batch.noKey"));
            patch(row.id, { state: "waiting" });
          } else {
            patch(row.id, { state: "failed", error: errorMessage(t, e) });
          }
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setRunning(false);
    router.refresh();
  }

  const pending = rows.filter((r) => r.state === "waiting");
  const failed = rows.filter((r) => r.state === "failed");
  const created = counts.done + counts.aiFailed;

  if (boxes.length === 0) {
    return <p className="plate p-6">{t("batch.noBoxes")}</p>;
  }

  return (
    <div className="space-y-5 pb-8">
      <p className="text-muted-foreground">{t("batch.help")}</p>
      {!aiAvailable && (
        <p className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {t("batch.noKey")}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="batch-box">{t("batch.box")}</Label>
        <select
          id="batch-box"
          value={boxId}
          disabled={running}
          onChange={(e) => setBoxId(Number(e.target.value))}
          className={selectClass}
        >
          {boxes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <label className="plate flex cursor-pointer items-start gap-3 p-3">
        <Checkbox
          checked={collection}
          disabled={running}
          onCheckedChange={(c) => setCollection(c === true)}
          className="mt-0.5 size-5"
        />
        <span className="font-semibold">{t("batch.collection")}</span>
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="h-11" disabled={running} onClick={() => fileRef.current?.click()}>
          <ImagePlus /> {t(rows.length ? "batch.more" : "batch.pick")}
        </Button>
        {rows.length > 0 && (
          <span className="text-sm font-medium text-muted-foreground">
            {t("batch.selected", { count: rows.length })}
          </span>
        )}
        <span className="flex-1" />
        {running ? (
          <Button type="button" variant="destructive" className="h-11" onClick={() => (stopRef.current = true)}>
            <Square /> {t("batch.stop")}
          </Button>
        ) : (
          <Button type="button" className="h-11 px-6 text-base font-semibold" disabled={!aiAvailable || pending.length === 0} onClick={() => run(pending)}>
            <Play /> {t("batch.start")}
          </Button>
        )}
      </div>

      {fatal && <p className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{fatal}</p>}

      {rows.length > 0 && (
        <section className="space-y-3">
          <div className="space-y-1">
            <div className="h-3 overflow-hidden rounded-sm border border-border bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${(finished / rows.length) * 100}%` }} />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t("batch.progress", { done: finished, total: rows.length })}</span>
              {running && <span>{t("batch.keepOpen")}</span>}
            </div>
          </div>

          {!running && finished > 0 && (
            <div className="plate space-y-2 p-3">
              <p className="font-semibold">
                {t("batch.summary", { ok: created, aiFailed: counts.aiFailed, failed: counts.failed })}
              </p>
              <div className="flex flex-wrap gap-2">
                {created > 0 && (
                  <Link href="/review" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
                    {t("batch.toReview")}
                  </Link>
                )}
                {failed.length > 0 && (
                  <Button variant="secondary" className="h-10" onClick={() => run(failed)}>
                    {t("batch.retry")}
                  </Button>
                )}
                <Button variant="outline" className="h-10" onClick={() => setRows((rs) => rs.filter((r) => r.state === "waiting"))}>
                  {t("batch.clear")}
                </Button>
              </div>
            </div>
          )}

          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-2">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-muted">
                  {r.item?.photos[0] && (
                    <Image src={`/api/photos/${r.item.photos[0]}?thumb=1`} alt="" fill unoptimized sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {r.item ? (
                    <Link href={`/item/${r.item.id}`} className="block truncate font-semibold underline-offset-2 hover:underline">
                      {r.item.name}
                    </Link>
                  ) : (
                    <span className="block truncate font-medium">{r.file.name}</span>
                  )}
                  <span className="block truncate text-xs text-muted-foreground">
                    {t(`batch.status.${r.state}`)}
                    {r.state === "failed" && r.error ? ` · ${r.error}` : ""}
                  </span>
                </div>
                <StateIcon state={r.state} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StateIcon({ state }: { state: State }) {
  switch (state) {
    case "running":
      return <Loader2 className="size-5 animate-spin text-primary" />;
    case "done":
      return <CheckCircle2 className="size-5 text-green-700" />;
    case "aiFailed":
      return <AlertTriangle className="size-5 text-amber-600" />;
    case "failed":
      return <XCircle className="size-5 text-destructive" />;
    default:
      return <CircleDashed className="size-5 text-muted-foreground" />;
  }
}
