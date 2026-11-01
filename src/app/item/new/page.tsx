import Link from "next/link";
import { ItemForm } from "@/components/item-form";
import { getT } from "@/lib/i18n";
import { listBoxes } from "@/lib/repo";

export default async function NewItemPage({ searchParams }: PageProps<"/item/new">) {
  const sp = await searchParams;
  const box = Number(Array.isArray(sp.box) ? sp.box[0] : sp.box);
  const { t } = await getT();
  const boxes = listBoxes();
  if (boxes.length === 0) {
    return (
      <div className="plate space-y-3 p-6">
        <p>{t("home.noBoxes")}</p>
        <Link href="/" className="font-semibold underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">{t("item.add")}</h1>
      <ItemForm boxes={boxes} defaultBoxId={Number.isInteger(box) && box > 0 ? box : undefined} />
    </div>
  );
}
