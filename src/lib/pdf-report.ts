import fs from "node:fs";
import PDFDocument from "pdfkit";
import { isValidPhotoName, photoPath } from "./photos";
import type { TFunction } from "./messages";
import type { Box, Item } from "./types";

type Doc = InstanceType<typeof PDFDocument>;

const PAGE = { w: 595.28, h: 841.89 };
const M = 40; // page margin
const FOOTER = 28; // room reserved for the footer
const BOTTOM = PAGE.h - M - FOOTER;
const CONTENT_W = PAGE.w - 2 * M;
const THUMB = 72;
const CARD_PAD = 8;
const CARD_GAP = 6;
const BOX_HEAD_H = 34;

const INK = "#1f2933";
const MUTED = "#6b7280";
const LINE = "#e2e5e9";
const BRAND = "#f08a24";

const TONES: Record<string, { bg: string; fg: string }> = {
  orange: { bg: "#f59a3a", fg: "#1f2933" },
  yellow: { bg: "#f5d94a", fg: "#1f2933" },
  steel: { bg: "#4b5563", fg: "#ffffff" },
  red: { bg: "#c8372d", fg: "#ffffff" },
  green: { bg: "#3a8a5b", fg: "#ffffff" },
  blue: { bg: "#2f5f9e", fg: "#ffffff" },
};

/** The built-in PDF fonts only cover Latin-1: swap everything else (emoji, CJK …) for "?". */
function clean(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[^ -~ -ÿ€]/g, "?")
    .trim();
}

function thumbBuffer(name: string | undefined): Buffer | null {
  if (!name || !isValidPhotoName(name)) return null;
  try {
    return fs.readFileSync(photoPath(name, true));
  } catch {
    return null;
  }
}

export type ReportData = { boxes: Box[]; itemsByBox: Map<number, Item[]> };

export function buildReport(
  data: ReportData,
  t: TFunction,
  locale: string,
  title: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: M, bottom: M, left: M, right: M },
      bufferPages: true,
      info: { Title: clean(title), Author: "ChaosGone" },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      render(doc, data, t, locale, title);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

function render(doc: Doc, data: ReportData, t: TFunction, locale: string, title: string) {
  const { boxes, itemsByBox } = data;
  const total = boxes.reduce((n, b) => n + (itemsByBox.get(b.id)?.length ?? 0), 0);
  const date = new Date().toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ---- title block ----
  doc.rect(0, 0, PAGE.w, 8).fill(BRAND);
  let y = M + 6;
  doc.font("Helvetica-Bold").fontSize(26).fillColor(INK).text(clean(title), M, y, { width: CONTENT_W });
  y = doc.y + 2;
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(
    `${date}  |  ${t("box.count", { count: boxes.length })}  |  ${t("box.items", { count: total })}`,
    M, y, { width: CONTENT_W },
  );
  y = doc.y + 14;

  // ---- overview of all boxes (only when it fits on the first page with room to spare) ----
  const rowH = 16;
  const perCol = Math.ceil(boxes.length / 2);
  if (boxes.length > 1 && y + 24 + perCol * rowH + 150 < BOTTOM) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(t("pdf.overview"), M, y);
    y = doc.y + 6;
    const colW = (CONTENT_W - 12) / 2;
    boxes.forEach((b, i) => {
      const x = M + Math.floor(i / perCol) * (colW + 12);
      const ry = y + (i % perCol) * rowH;
      const tone = TONES[b.color] ?? TONES.orange;
      doc.roundedRect(x, ry + 2, 9, 9, 2).fill(tone.bg);
      doc.font("Helvetica").fontSize(9.5).fillColor(INK)
        .text(clean(b.name), x + 15, ry + 1.5, { width: colW - 50, height: 11, ellipsis: true, lineBreak: false });
      doc.fillColor(MUTED).text(String(itemsByBox.get(b.id)?.length ?? 0), x + colW - 30, ry + 1.5, {
        width: 30, align: "right", lineBreak: false,
      });
    });
    y += perCol * rowH + 10;
  }

  doc.moveTo(M, y).lineTo(PAGE.w - M, y).lineWidth(0.5).strokeColor(LINE).stroke();
  y += 14;

  // ---- one section per box ----
  for (const box of boxes) {
    const items = itemsByBox.get(box.id) ?? [];
    const tone = TONES[box.color] ?? TONES.orange;

    const first = items[0] ? cardHeight(doc, items[0], t) : 24;
    // The header must never be stranded at the bottom of a page: it needs room for the first card.
    if (y + BOX_HEAD_H + 8 + first > BOTTOM) {
      doc.addPage();
      y = M;
    }
    const drawHeader = (suffix = "") => {
      doc.roundedRect(M, y, CONTENT_W, BOX_HEAD_H, 5).fill(tone.bg);
      doc.font("Helvetica-Bold").fontSize(14).fillColor(tone.fg)
        .text(clean(box.name) + suffix, M + 12, y + 10, {
          width: CONTENT_W - 110, height: 18, ellipsis: true, lineBreak: false,
        });
      doc.font("Helvetica").fontSize(10).fillColor(tone.fg)
        .text(t("box.items", { count: items.length }), M + CONTENT_W - 112, y + 12, {
          width: 100, align: "right", lineBreak: false,
        });
      y += BOX_HEAD_H + 8;
    };
    drawHeader();

    if (items.length === 0) {
      doc.font("Helvetica-Oblique").fontSize(10).fillColor(MUTED).text(t("box.empty"), M + 4, y);
      y = doc.y + 16;
      continue;
    }

    for (const item of items) {
      const h = cardHeight(doc, item, t);
      if (y + h > BOTTOM) {
        doc.addPage();
        y = M;
        drawHeader(` ${t("pdf.continued")}`);
      }
      drawCard(doc, item, t, y, h);
      y += h + CARD_GAP;
    }
    y += 12;
  }

  // ---- header strip + footer on every page ----
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // otherwise writing in the footer area would add a page
    if (i > range.start) doc.rect(0, 0, PAGE.w, 8).fill(BRAND);
    const fy = PAGE.h - M + 4;
    doc.moveTo(M, fy - 6).lineTo(PAGE.w - M, fy - 6).lineWidth(0.5).strokeColor(LINE).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(MUTED);
    doc.text("ChaosGone", M, fy, { width: CONTENT_W / 2, lineBreak: false });
    doc.text(t("pdf.page", { n: i + 1, total: range.count }), M + CONTENT_W / 2, fy, {
      width: CONTENT_W / 2, align: "right", lineBreak: false,
    });
  }
}

const TEXT_X = M + CARD_PAD + THUMB + 12;
const TEXT_W = PAGE.w - M - CARD_PAD - TEXT_X;
const DESC_LINES = 4;
const NOTE_LINES = 2;

function metaLine(item: Item, t: TFunction): string {
  const parts: string[] = [];
  if (item.quantity !== null) parts.push(`${t("pdf.qty")}: ${item.quantity}`);
  if (item.is_collection) parts.push(t("pdf.collection"));
  if (item.ean) parts.push(`EAN ${clean(item.ean)}`);
  if (item.photos.length > 1) parts.push(t("pdf.photos", { count: item.photos.length }));
  return parts.join("   |   ");
}

/** Height of the clamped text so that card sizes are known before anything is drawn. */
function textBlocks(doc: Doc, item: Item, t: TFunction) {
  const lh = (size: number, font: string, text: string, width: number, maxLines: number) => {
    doc.font(font).fontSize(size);
    const line = doc.currentLineHeight(true);
    const natural = doc.heightOfString(text, { width });
    return Math.min(natural, line * maxLines);
  };
  const name = clean(item.name) || "-";
  const meta = metaLine(item, t);
  const desc = clean(item.description);
  const notes = clean(item.notes);
  const blocks = [
    { font: "Helvetica-Bold", size: 11.5, color: INK, text: name, h: lh(11.5, "Helvetica-Bold", name, TEXT_W, 2), gap: 3 },
    meta && { font: "Helvetica", size: 8.5, color: MUTED, text: meta, h: lh(8.5, "Helvetica", meta, TEXT_W, 2), gap: 4 },
    desc && { font: "Helvetica", size: 9, color: INK, text: desc, h: lh(9, "Helvetica", desc, TEXT_W, DESC_LINES), gap: 3 },
    notes && {
      font: "Helvetica-Oblique", size: 8.5, color: MUTED, text: `${t("pdf.notes")}: ${notes}`,
      h: lh(8.5, "Helvetica-Oblique", `${t("pdf.notes")}: ${notes}`, TEXT_W, NOTE_LINES), gap: 0,
    },
  ].filter(Boolean) as { font: string; size: number; color: string; text: string; h: number; gap: number }[];
  return blocks;
}

function cardHeight(doc: Doc, item: Item, t: TFunction): number {
  const blocks = textBlocks(doc, item, t);
  const textH = blocks.reduce((n, b) => n + b.h + b.gap, 0);
  return Math.ceil(Math.max(THUMB, textH) + 2 * CARD_PAD);
}

function drawCard(doc: Doc, item: Item, t: TFunction, y: number, h: number) {
  doc.roundedRect(M, y, CONTENT_W, h, 5).lineWidth(0.6).fillAndStroke("#ffffff", LINE);

  const tx = M + CARD_PAD;
  const ty = y + CARD_PAD;
  const img = thumbBuffer(item.photos[0]);
  doc.save();
  doc.roundedRect(tx, ty, THUMB, THUMB, 4).clip();
  if (img) {
    doc.image(img, tx, ty, { cover: [THUMB, THUMB], align: "center", valign: "center" });
  } else {
    doc.rect(tx, ty, THUMB, THUMB).fill("#f1f3f5");
    doc.font("Helvetica").fontSize(8).fillColor(MUTED)
      .text(t("pdf.noPhoto"), tx, ty + THUMB / 2 - 4, { width: THUMB, align: "center", lineBreak: false });
  }
  doc.restore();

  let cy = ty;
  for (const b of textBlocks(doc, item, t)) {
    doc.font(b.font).fontSize(b.size).fillColor(b.color).text(b.text, TEXT_X, cy, {
      width: TEXT_W, height: b.h, ellipsis: true,
    });
    cy += b.h + b.gap;
  }
}
