import { getT } from "@/lib/i18n";
import { err, parseId } from "@/lib/http";
import { buildReport } from "@/lib/pdf-report";
import { getBox, listBoxes, listItems } from "@/lib/repo";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

/** PDF inventory report of all boxes, or of a single one with `?box=<id>`. */
export async function GET(req: Request) {
  const boxParam = new URL(req.url).searchParams.get("box");
  const boxId = boxParam ? parseId(boxParam) : null;
  if (boxParam && !boxId) return err(400, "invalid_box");

  const { t, locale } = await getT();
  const single = boxId ? getBox(boxId) : undefined;
  if (boxId && !single) return err(404, "not_found");

  const boxes = single ? [single] : listBoxes();
  const itemsByBox = new Map<number, Item[]>();
  for (const item of listItems(single?.id)) {
    const list = itemsByBox.get(item.box_id) ?? [];
    list.push(item);
    itemsByBox.set(item.box_id, list);
  }
  for (const list of itemsByBox.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, locale, { numeric: true }));
  }

  const title = single ? `${t("app.name")} - ${single.name}` : `${t("app.name")} - ${t("pdf.title")}`;
  const pdf = await buildReport({ boxes, itemsByBox }, t, locale, title);
  const file = `chaosgone-${single ? `box-${single.id}` : "inventory"}-${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
