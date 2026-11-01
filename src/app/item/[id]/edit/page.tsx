import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { getT } from "@/lib/i18n";
import { getItem, listBoxes } from "@/lib/repo";

export default async function EditItemPage({ params }: PageProps<"/item/[id]/edit">) {
  const { id } = await params;
  const item = Number.isInteger(Number(id)) ? getItem(Number(id)) : undefined;
  if (!item) notFound();
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">{t("item.edit")}</h1>
      <ItemForm boxes={listBoxes()} item={item} />
    </div>
  );
}
