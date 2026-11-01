"use client";

import { useEffect, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "./i18n-provider";

// Minimal typing for the (Chromium) BarcodeDetector API.
type Detector = { detect(src: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts?: { formats?: string[] }) => Detector;

function detectorCtor(): DetectorCtor | undefined {
  return (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
}

export function BarcodeScanner({ onDetect }: { onDetect: (value: string) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [problem, setProblem] = useState<"unsupported" | "denied" | null>(null);

  useEffect(() => {
    if (!open || !video) return;
    const Ctor = detectorCtor();
    if (!Ctor) return; // "unsupported" is set when opening
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    const detector = new Ctor({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"],
    });
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((tr) => tr.stop());
        stream = s;
        video.srcObject = s;
        await video.play();
        timer = setInterval(async () => {
          try {
            const found = await detector.detect(video);
            if (found[0]?.rawValue) {
              onDetect(found[0].rawValue);
              setOpen(false);
            }
          } catch {
            /* frame not ready yet */
          }
        }, 300);
      })
      .catch(() => setProblem("denied"));
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [open, video, onDetect]);

  return (
    <>
      <Button type="button" variant="outline" className="h-11" onClick={() => {
          setProblem(detectorCtor() ? null : "unsupported");
          setOpen(true);
        }}
      >
        <ScanBarcode /> {t("item.scan")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("item.scan.title")}</DialogTitle>
            <DialogDescription>{t("item.scan.hint")}</DialogDescription>
          </DialogHeader>
          {problem ? (
            <p className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
              {t(problem === "unsupported" ? "item.scan.unsupported" : "item.scan.denied")}
            </p>
          ) : (
            <video
              ref={setVideo}
              muted
              playsInline
              className="aspect-[4/3] w-full rounded-sm bg-black object-cover"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
